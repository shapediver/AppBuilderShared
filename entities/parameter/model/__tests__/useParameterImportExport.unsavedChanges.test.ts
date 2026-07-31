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

jest.mock("@AppBuilderLib/shared/lib/ErrorReportingContext", () => ({
	ErrorReportingContext: React.createContext({captureException: jest.fn()}),
}));

jest.mock("@AppBuilderLib/shared/model/useShapeDiverStorePlatform", () => ({
	useShapeDiverStorePlatform: (selector: any) =>
		selector({currentModel: undefined}),
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

jest.mock("@AppBuilderLib/entities/parameter/lib/parameterStates", () => ({
	getParameterStates: () => [],
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

function seedUnsaved() {
	store.getState().resetHistory();
	store.getState().pushHistoryState({}, false);
	store.getState().pushHistoryState({ns: {p: "changed"}});
}

function currentUnsaved() {
	const {history, historyIndex} = store.getState();
	return history[historyIndex]?.unsavedChanges;
}

describe("useParameterImportExport unsavedChanges wiring", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// jsdom lacks URL.createObjectURL
		(URL as any).createObjectURL = jest.fn(() => "blob:fake");
		(URL as any).revokeObjectURL = jest.fn();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe("exportParameters", () => {
		it("clears unsavedChanges after exporting parameters to JSON", async () => {
			seedUnsaved();
			expect(currentUnsaved()).toBe(true);

			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await result.current.exportParameters();
			});

			expect(notificationMock.success).toHaveBeenCalled();
			expect(currentUnsaved()).toBe(false);
		});
	});

	describe("importParameters", () => {
		function installFakeFileInput(fileContents: string) {
			const fakeFile = {
				text: () => Promise.resolve(fileContents),
			};
			const realCreate = document.createElement.bind(document);
			const spy = jest
				.spyOn(document, "createElement")
				.mockImplementation((tag: string) => {
					if (tag === "input") {
						const el = realCreate("input") as HTMLInputElement;
						el.click = jest.fn(() => {
							// simulate the user selecting a file
							Promise.resolve().then(() => {
								el.onchange?.({
									target: {files: [fakeFile as any]},
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
			});
			generateParameterFeedback.mockReturnValue({
				type: "success",
				message: "imported",
			});

			installFakeFileInput(
				JSON.stringify({parameters: [{id: "paramA"}]}),
			);

			const {result} = renderHook(() => useParameterImportExport("ns"));

			await act(async () => {
				await result.current.importParameters();
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
				await expect(
					result.current.importParameters(),
				).rejects.toThrow();
			});

			expect(currentUnsaved()).toBe(before);
		});
	});
});
