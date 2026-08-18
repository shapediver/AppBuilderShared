import {QUERYPARAM_MODELSTATEID} from "@AppBuilderLib/shared/config/queryparams";
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

describe("importModelStateCore", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns failure and notifies on empty modelStateId", async () => {
		const onNotification = jest.fn();
		const result = await importModelStateCore({
			sessionApi: undefined,
			namespace: "ns",
			getParameterStates: () => [],
			batchParameterValueUpdate: jest.fn(),
			clearUnsavedChanges: jest.fn(),
			props: {modelStateId: "   "},
			onNotification,
		});

		expect(result).toEqual({
			success: false,
			message: `Please provide a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
		});
		expect(onNotification).toHaveBeenCalledWith({
			type: "error",
			message: `Please enter a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
		});
	});

	it("returns success and notifies on valid import", async () => {
		const onNotification = jest.fn();
		const data = {modelState: {parameters: {p1: 1}}};
		const sessionApi = {
			getModelState: jest.fn().mockResolvedValue(data),
		};
		const batchParameterValueUpdate = jest
			.fn()
			.mockResolvedValue(undefined);
		const clearUnsavedChanges = jest.fn();

		filterAndValidateModelStateParameters.mockReturnValue({
			hasValidParameters: true,
			validParameters: {p1: 1},
			invalidParameters: [],
			skippedParameters: [],
		});
		generateParameterFeedback.mockReturnValue({
			type: "success",
			message: "Model state abc imported successfully",
		});

		const result = await importModelStateCore({
			sessionApi: sessionApi as any,
			namespace: "ns",
			getParameterStates: () => [],
			batchParameterValueUpdate,
			clearUnsavedChanges,
			props: {modelStateId: "abc"},
			onNotification,
		});

		expect(result).toEqual({success: true, data});
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			ns: {p1: 1},
		});
		expect(clearUnsavedChanges).toHaveBeenCalled();
		expect(onNotification).toHaveBeenCalledWith({
			type: "success",
			message: "Model state abc imported successfully",
		});
	});
});
