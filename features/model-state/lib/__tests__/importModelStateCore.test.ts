import {QUERYPARAM_MODELSTATEID} from "@AppBuilderLib/shared/config/queryparams";
import {applyModelStateToUrl} from "@AppBuilderLib/shared/lib/modifyUrl";
import {importModelStateCore} from "../importModelStateCore";

const filterAndValidateModelStateParameters = jest.fn();
const generateParameterFeedback = jest.fn();
jest.mock("@AppBuilderLib/entities/parameter/lib/parametersFilter", () => ({
	filterAndValidateModelStateParameters: (...args: unknown[]) =>
		filterAndValidateModelStateParameters(...args),
	generateParameterFeedback: (...args: unknown[]) =>
		generateParameterFeedback(...args),
}));

jest.mock("@AppBuilderLib/shared/lib/modifyUrl", () => ({
	applyModelStateToUrl: jest.fn(),
}));

function mockValidFilter(
	overrides: {
		skippedParameters?: string[];
		invalidParameters?: {name: string; message: string}[];
	} = {},
) {
	filterAndValidateModelStateParameters.mockReturnValue({
		hasValidParameters: true,
		validParameters: {p1: 1},
		invalidParameters: overrides.invalidParameters ?? [],
		skippedParameters: overrides.skippedParameters ?? [],
	});
	generateParameterFeedback.mockReturnValue({
		type: "success",
		message: "imported",
	});
}

function sessionWithState(
	data: unknown = {modelState: {parameters: {p1: 1}}},
) {
	return {
		getModelState: jest.fn().mockResolvedValue(data),
	};
}

async function runImport(
	overrides: Partial<Parameters<typeof importModelStateCore>[0]> = {},
) {
	return importModelStateCore({
		sessionApi: overrides.sessionApi as never,
		namespace: overrides.namespace ?? "ns",
		getParameterStates: overrides.getParameterStates ?? (() => []),
		batchParameterValueUpdate:
			overrides.batchParameterValueUpdate ??
			jest.fn().mockResolvedValue(undefined),
		clearUnsavedChanges: overrides.clearUnsavedChanges ?? jest.fn(),
		props: overrides.props ?? {modelStateId: "abc"},
		onNotification: overrides.onNotification,
		onLoadingChange: overrides.onLoadingChange,
		onError: overrides.onError,
	});
}

describe("importModelStateCore", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns failure and notifies on empty modelStateId", async () => {
		const onNotification = jest.fn();
		const result = await runImport({
			sessionApi: undefined,
			props: {modelStateId: "   "},
			onNotification,
		});

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(onNotification).toHaveBeenCalledWith({
			type: "error",
			message: `Please enter a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
		});
		expect(result).toEqual({
			success: false,
			message: `Please provide a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
		});
	});

	it("does not throw when empty modelStateId has no onNotification", async () => {
		const result = await runImport({
			sessionApi: undefined,
			props: {modelStateId: ""},
		});
		expect(result.success).toBe(false);
	});

	it("extracts modelStateId from a URL", async () => {
		mockValidFilter();
		const sessionApi = sessionWithState();
		const result = await runImport({
			sessionApi: sessionApi as never,
			props: {
				modelStateId: `https://example.com/view?${QUERYPARAM_MODELSTATEID}=from-url`,
			},
			onNotification: jest.fn(),
		});
		expect(sessionApi.getModelState).toHaveBeenCalledWith("from-url");
		expect(result.success).toBe(true);
	});

	it("treats an id containing http as an id, not a URL", async () => {
		mockValidFilter();
		const sessionApi = sessionWithState();
		await runImport({
			sessionApi: sessionApi as never,
			props: {modelStateId: "token-with-http-inside"},
			onNotification: jest.fn(),
		});
		expect(sessionApi.getModelState).toHaveBeenCalledWith(
			"token-with-http-inside",
		);
	});

	it("returns failure when a URL has no modelStateId query param", async () => {
		const getModelState = jest.fn();
		const result = await runImport({
			sessionApi: {getModelState} as never,
			props: {modelStateId: "https://example.com/view"},
			onNotification: jest.fn(),
		});
		expect(result.success).toBe(false);
		expect(getModelState).not.toHaveBeenCalled();
	});

	it("returns failure when the session is missing", async () => {
		const onNotification = jest.fn();
		const onLoadingChange = jest.fn();
		const result = await runImport({
			sessionApi: undefined,
			props: {modelStateId: "abc"},
			onNotification,
			onLoadingChange,
		});
		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(onNotification).not.toHaveBeenCalled();
		expect(onLoadingChange).not.toHaveBeenCalled();
	});

	it("returns success and notifies on valid import", async () => {
		mockValidFilter();
		const onNotification = jest.fn();
		const onLoadingChange = jest.fn();
		const data = {modelState: {parameters: {p1: 1}}};
		const sessionApi = sessionWithState(data);
		const batchParameterValueUpdate = jest
			.fn()
			.mockResolvedValue(undefined);
		const clearUnsavedChanges = jest.fn();

		const result = await runImport({
			sessionApi: sessionApi as never,
			batchParameterValueUpdate,
			clearUnsavedChanges,
			props: {modelStateId: "abc"},
			onNotification,
			onLoadingChange,
		});

		expect(result).toEqual({success: true, data});
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			ns: {p1: 1},
		});
		expect(clearUnsavedChanges).toHaveBeenCalled();
		expect(applyModelStateToUrl).toHaveBeenCalledWith("abc", true);
		expect(onLoadingChange).toHaveBeenCalledWith(true);
		expect(onLoadingChange).toHaveBeenCalledWith(false);
		expect(onNotification).toHaveBeenCalledWith({
			type: "success",
			message: "imported",
		});
	});

	it("does not throw on success when optional callbacks are omitted", async () => {
		mockValidFilter();
		const result = await runImport({
			sessionApi: sessionWithState() as never,
		});
		expect(result.success).toBe(true);
	});

	it("does not throw on fetch error when onNotification is omitted", async () => {
		const sessionApi = {
			getModelState: jest.fn().mockRejectedValue(new Error("boom")),
		};
		const result = await runImport({
			sessionApi: sessionApi as never,
		});
		expect(result.success).toBe(false);
	});

	it("returns failure and reports when getModelState yields an error", async () => {
		const onNotification = jest.fn();
		const onError = jest.fn();
		const err = new Error("boom");
		const sessionApi = {
			getModelState: jest.fn().mockRejectedValue(err),
		};

		const result = await runImport({
			sessionApi: sessionApi as never,
			onNotification,
			onError,
		});

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(onError).toHaveBeenCalledWith(err);
		expect(onNotification).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "error",
				title: expect.any(String),
				message: expect.any(String),
			}),
		);
	});

	it("returns failure when getModelState yields an error without a message", async () => {
		const onNotification = jest.fn();
		const err = new Error("");
		const sessionApi = {
			getModelState: jest.fn().mockRejectedValue(err),
		};

		const result = await runImport({
			sessionApi: sessionApi as never,
			onNotification,
		});

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect((result.message as string).length).toBeGreaterThan(0);
	});

	it("returns failure when the model state has no parameters", async () => {
		const onNotification = jest.fn();
		const result = await runImport({
			sessionApi: sessionWithState({modelState: {}}) as never,
			onNotification,
		});
		expect(result.success).toBe(false);
		expect(onNotification).toHaveBeenCalledWith(
			expect.objectContaining({type: "error"}),
		);
	});

	it("returns failure when modelState is missing", async () => {
		const result = await runImport({
			sessionApi: sessionWithState({}) as never,
		});
		expect(result.success).toBe(false);
	});

	it("does not throw on invalid parameters when onNotification is omitted", async () => {
		filterAndValidateModelStateParameters.mockReturnValue({
			hasValidParameters: false,
			validParameters: {},
			invalidParameters: [],
			skippedParameters: [],
		});
		generateParameterFeedback.mockReturnValue({
			type: "error",
			message: "invalid",
		});
		const result = await runImport({
			sessionApi: sessionWithState() as never,
		});
		expect(result.success).toBe(false);
	});

	it("returns failure when no parameters are valid", async () => {
		filterAndValidateModelStateParameters.mockReturnValue({
			hasValidParameters: false,
			validParameters: {},
			invalidParameters: [{name: "p1", message: "bad"}],
			skippedParameters: [],
		});
		generateParameterFeedback.mockReturnValue({
			type: "error",
			message: "invalid",
		});
		const batchParameterValueUpdate = jest.fn();
		const clearUnsavedChanges = jest.fn();
		const onNotification = jest.fn();

		const result = await runImport({
			sessionApi: sessionWithState() as never,
			batchParameterValueUpdate,
			clearUnsavedChanges,
			onNotification,
		});

		expect(result.success).toBe(false);
		expect(result).toEqual(
			expect.objectContaining({
				success: false,
				invalidParameters: [{name: "p1", message: "bad"}],
			}),
		);
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
		expect(clearUnsavedChanges).not.toHaveBeenCalled();
		expect(onNotification).toHaveBeenCalledWith({
			type: "error",
			message: "invalid",
		});
	});

	it("includes invalidParameters when some parameters were skipped", async () => {
		mockValidFilter({
			skippedParameters: ["gone"],
			invalidParameters: [{name: "gone", message: "skipped"}],
		});
		generateParameterFeedback.mockReturnValue({
			type: "warning",
			message: "partial",
		});

		const result = await runImport({
			sessionApi: sessionWithState() as never,
			onNotification: jest.fn(),
		});

		expect(result).toEqual({
			success: true,
			data: {modelState: {parameters: {p1: 1}}},
			invalidParameters: [{name: "gone", message: "skipped"}],
		});
	});
});
