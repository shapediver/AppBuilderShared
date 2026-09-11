/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {act, renderHook} from "@testing-library/react";
import * as React from "react";
import {useParameterImportExport} from "../useParameterImportExport";

jest.mock("@mantine/core", () => {
	const actual = jest.requireActual("@mantine/core");
	return {
		...actual,
		useProps: (_name: string, _defaults: any, props: any) => props ?? {},
	};
});

const notificationMock = {
	success: jest.fn(),
	error: jest.fn(),
	warning: jest.fn(),
	info: jest.fn(),
};
jest.mock(
	"@AppBuilderLib/features/notifications/model/useNotificationStore",
	() => ({
		useNotificationStore: () => notificationMock,
	}),
);

const captureException = jest.fn();
jest.mock("@AppBuilderLib/shared/lib/ErrorReportingContext", () => ({
	ErrorReportingContext: React.createContext({
		captureException: (...args: unknown[]) => captureException(...args),
	}),
}));

const platformState: {currentModel: {id: string; slug: string} | undefined} = {
	currentModel: undefined,
};
jest.mock("@AppBuilderLib/shared/model/useShapeDiverStorePlatform", () => ({
	useShapeDiverStorePlatform: (selector: any) => selector(platformState),
}));

const filterAndValidateParameters = jest.fn();
const generateParameterFeedback = jest.fn();
const isImportParameterArray = jest.fn();
jest.mock("@AppBuilderLib/entities/parameter/lib/parametersFilter", () => ({
	filterAndValidateParameters: (...a: any[]) =>
		filterAndValidateParameters(...a),
	generateParameterFeedback: (...a: any[]) => generateParameterFeedback(...a),
	isImportParameterArray: (...a: any[]) => isImportParameterArray(...a),
}));

const getParameterStates = jest.fn(() => []);
jest.mock("@AppBuilderLib/entities/parameter/lib/parameterStates", () => ({
	getParameterStates: (...a: unknown[]) => getParameterStates(...a),
}));

jest.mock(
	"@AppBuilderLib/entities/parameter/lib/resolveParameterExportValue",
	() => ({
		resolveParameterExportValue: () => "exported-value",
	}),
);

// Real parameter store.
import {useShapeDiverStoreParameters} from "../useShapeDiverStoreParameters";

const store = useShapeDiverStoreParameters;
const originalBatchParameterValueUpdate =
	store.getState().batchParameterValueUpdate;
const originalBlob = globalThis.Blob;

function seedUnsaved() {
	store.getState().resetHistory();
	store.getState().pushHistoryState({}, false);
	store.getState().pushHistoryState({ns: {p: "changed"}});
}

function currentUnsaved() {
	const {history, historyIndex} = store.getState();
	return history[historyIndex]?.unsavedChanges;
}

function exportDateStamp() {
	return new Date().toISOString().split("T")[0];
}

describe("useParameterImportExport unsavedChanges wiring", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		platformState.currentModel = undefined;
		getParameterStates.mockReturnValue([]);
		store.setState({
			batchParameterValueUpdate: originalBatchParameterValueUpdate,
		});
		// jsdom lacks URL.createObjectURL
		(URL as any).createObjectURL = jest.fn(() => "blob:fake");
		(URL as any).revokeObjectURL = jest.fn();
		jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
			() => undefined,
		);
	});

	afterEach(() => {
		jest.restoreAllMocks();
		globalThis.Blob = originalBlob;
	});

	describe("exportParameters", () => {
		function captureExport() {
			let json = "";
			const RealBlob = globalThis.Blob;
			globalThis.Blob = jest.fn(
				(parts?: BlobPart[], options?: BlobPropertyBag) => {
					json = String(parts?.[0] ?? "");
					return new RealBlob(parts, options);
				},
			) as unknown as typeof Blob;

			const anchors: HTMLAnchorElement[] = [];
			const realCreate = document.createElement.bind(document);
			jest.spyOn(document, "createElement").mockImplementation(
				(tag: string) => {
					const el = realCreate(tag);
					if (tag === "a") {
						el.click = jest.fn();
						anchors.push(el as HTMLAnchorElement);
					}
					return el;
				},
			);

			return {
				getJson: () => json,
				getAnchor: () => anchors[0],
				restoreBlob: () => {
					globalThis.Blob = RealBlob;
				},
			};
		}

		it("clears unsavedChanges after exporting parameters to JSON", async () => {
			seedUnsaved();
			expect(currentUnsaved()).toBe(true);

			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await result.current.exportParameters();
			});

			expect(notificationMock.success).toHaveBeenCalledWith({
				message: "Parameter values exported successfully",
			});
			expect(currentUnsaved()).toBe(false);
		});

		it("writes parameter id, value, and name into the downloaded JSON", async () => {
			getParameterStates.mockReturnValue([
				{
					definition: {id: "p1", name: "Width", type: "String"},
					state: {
						execValue: "hello",
						stringExecValue: () => "hello",
					},
				},
			]);
			const capture = captureExport();

			const {result} = renderHook(() => useParameterImportExport("ns"));
			await act(async () => {
				await result.current.exportParameters();
			});

			expect(JSON.parse(capture.getJson())).toEqual({
				parameters: [
					{id: "p1", value: "exported-value", name: "Width"},
				],
			});
			expect(capture.getAnchor().download).toBe(
				`parameters_ns_${exportDateStamp()}.json`,
			);
			expect(capture.getAnchor().click).toHaveBeenCalled();
			expect(getParameterStates).toHaveBeenCalledWith("ns");
			capture.restoreBlob();
		});

		it("includes model_id and slug when a platform model is present", async () => {
			platformState.currentModel = {id: "model-1", slug: "chair"};
			getParameterStates.mockReturnValue([]);
			const capture = captureExport();

			const {result} = renderHook(() => useParameterImportExport("ns"));
			await act(async () => {
				await result.current.exportParameters();
			});

			expect(JSON.parse(capture.getJson())).toEqual({
				model_id: "model-1",
				parameters: [],
			});
			expect(capture.getAnchor().download).toBe(
				`parameters_chair_${exportDateStamp()}.json`,
			);
			capture.restoreBlob();
		});
	});

	describe("importParameters", () => {
		function installFakeFileInput(
			fileContents: string,
			options?: {
				files?: unknown;
				text?: () => Promise<string>;
			},
		) {
			const fakeFile = {
				text: options?.text ?? (() => Promise.resolve(fileContents)),
			};
			const realCreate = document.createElement.bind(document);
			const spy = jest
				.spyOn(document, "createElement")
				.mockImplementation((tag: string) => {
					if (tag === "input") {
						const el = realCreate("input") as HTMLInputElement;
						el.click = jest.fn(() => {
							Promise.resolve().then(() => {
								el.onchange?.({
									target: {
										files:
											options && "files" in options
												? options.files
												: [fakeFile as any],
									},
								} as any);
							});
						});
						return el;
					}
					return realCreate(tag);
				});
			return spy;
		}

		it("clears unsavedChanges after importing a valid parameter JSON file", async () => {
			seedUnsaved();
			expect(currentUnsaved()).toBe(true);

			isImportParameterArray.mockReturnValue(true);
			filterAndValidateParameters.mockReturnValue({
				hasValidParameters: true,
				validParameters: {paramA: 1},
				skippedParameters: [],
				invalidParameters: [],
			});
			generateParameterFeedback.mockReturnValue({
				type: "success",
				message: "imported",
			});

			installFakeFileInput(
				JSON.stringify({parameters: [{id: "paramA"}]}),
			);

			const batchParameterValueUpdate = jest
				.fn()
				.mockResolvedValue(undefined);
			store.setState({batchParameterValueUpdate});

			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await result.current.importParameters();
			});

			expect(batchParameterValueUpdate).toHaveBeenCalledWith({
				ns: {paramA: 1},
			});
			expect(generateParameterFeedback).toHaveBeenCalledWith(
				expect.objectContaining({hasValidParameters: true}),
				"Parameter values imported successfully",
			);
			expect(notificationMock.success).toHaveBeenCalledWith({
				message: "imported",
			});
			expect(currentUnsaved()).toBe(false);
		});

		it("does not clear unsavedChanges when the imported JSON is invalid", async () => {
			seedUnsaved();
			const before = currentUnsaved();

			isImportParameterArray.mockReturnValue(false);

			installFakeFileInput(
				JSON.stringify({parameters: [{id: "paramA"}]}),
			);

			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await expect(result.current.importParameters()).rejects.toThrow(
					"The schema of the parameters is not valid",
				);
			});

			expect(notificationMock.error).toHaveBeenCalledWith({
				message: "The schema of the parameters is not valid",
			});
			expect(currentUnsaved()).toBe(before);
		});

		it("rejects when no file is selected", async () => {
			installFakeFileInput("", {files: null});
			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await expect(result.current.importParameters()).rejects.toThrow(
					"No file selected",
				);
			});

			expect(notificationMock.error).toHaveBeenCalledWith({
				message: "No file selected",
			});
			expect(captureException).not.toHaveBeenCalled();
		});

		it("rejects when the file list is empty", async () => {
			installFakeFileInput("", {files: []});
			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await expect(result.current.importParameters()).rejects.toThrow(
					"No file selected",
				);
			});
		});

		it("reports and rejects when reading the file fails", async () => {
			const readError = new Error("read failed");
			installFakeFileInput("", {
				text: () => Promise.reject(readError),
			});
			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await expect(result.current.importParameters()).rejects.toThrow(
					"read failed",
				);
			});

			expect(captureException).toHaveBeenCalledWith(readError);
			expect(notificationMock.error).toHaveBeenCalledWith({
				message: "read failed",
			});
		});

		it("reports and rejects when the file is not JSON", async () => {
			installFakeFileInput("{not json");
			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await expect(
					result.current.importParameters(),
				).rejects.toThrow();
			});

			expect(captureException).toHaveBeenCalled();
			expect(notificationMock.error).toHaveBeenCalled();
			expect(isImportParameterArray).not.toHaveBeenCalled();
		});

		it("rejects when the JSON has no parameters array", async () => {
			installFakeFileInput(JSON.stringify({}));
			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await expect(result.current.importParameters()).rejects.toThrow(
					"The file doesn't contain the parameters data",
				);
			});

			expect(notificationMock.error).toHaveBeenCalledWith({
				message: "The file doesn't contain the parameters data",
			});
			expect(isImportParameterArray).not.toHaveBeenCalled();
		});

		it("rejects when parameters is not an array", async () => {
			installFakeFileInput(JSON.stringify({parameters: {id: "p1"}}));
			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await expect(result.current.importParameters()).rejects.toThrow(
					"The file doesn't contain the parameters data",
				);
			});
		});

		it("rejects when no imported parameters are valid", async () => {
			seedUnsaved();
			isImportParameterArray.mockReturnValue(true);
			filterAndValidateParameters.mockReturnValue({
				hasValidParameters: false,
				validParameters: {},
				skippedParameters: ["missing"],
				invalidParameters: [],
			});
			generateParameterFeedback.mockReturnValue({
				type: "error",
				message:
					"The parameters do not match the parameters of this model.",
			});
			installFakeFileInput(
				JSON.stringify({parameters: [{id: "missing", value: 1}]}),
			);
			const batchParameterValueUpdate = jest.fn();
			store.setState({batchParameterValueUpdate});

			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await expect(result.current.importParameters()).rejects.toThrow(
					"The parameters do not match the parameters of this model.",
				);
			});

			expect(batchParameterValueUpdate).not.toHaveBeenCalled();
			expect(notificationMock.error).toHaveBeenCalledWith({
				message:
					"The parameters do not match the parameters of this model.",
			});
			expect(currentUnsaved()).toBe(true);
		});
	});

	describe("resetParameters", () => {
		it("applies each parameter defval and notifies success", async () => {
			getParameterStates.mockReturnValue([
				{definition: {id: "p1", defval: "default-a"}},
				{definition: {id: "p2", defval: 0}},
			]);
			const batchParameterValueUpdate = jest
				.fn()
				.mockResolvedValue(undefined);
			store.setState({batchParameterValueUpdate});

			const {result} = renderHook(() => useParameterImportExport("ns"));
			await act(async () => {
				await result.current.resetParameters();
			});

			expect(getParameterStates).toHaveBeenCalledWith("ns");
			expect(batchParameterValueUpdate).toHaveBeenCalledWith({
				ns: {p1: "default-a", p2: 0},
			});
			expect(notificationMock.success).toHaveBeenCalledWith({
				message: "Parameters reset to default values",
			});
		});
	});
});
