import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {composeSdColor} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {resolveAndUpdate} from "../lib/resolveSetParameterUpdates";

function createMockParameter(
	overrides: Partial<IShapeDiverParameter<any>> & {
		definition: IShapeDiverParameter<any>["definition"];
	},
): IShapeDiverParameter<any> {
	return {
		state: {
			uiValue: overrides.state?.uiValue,
			execValue: overrides.state?.execValue,
			dirty: false,
			disableOtherParameters: false,
			stringExecValue: () => "",
		},
		actions: {
			setUiValue: () => true,
			setUiAndExecValue: () => true,
			execute: async () => "",
			isValid: overrides.actions?.isValid ?? (() => true),
			isUiValueDifferent: () => false,
			resetToDefaultValue: () => undefined,
			resetToExecValue: () => undefined,
		},
		acceptRejectMode: false,
		...overrides,
	} as IShapeDiverParameter<any>;
}

describe("resolveAndUpdate", () => {
	const namespace = "session-1";
	const batchParameterValueUpdate = jest.fn().mockResolvedValue(undefined);

	const getParametersFor =
		(paramsByNamespace: Record<string, IShapeDiverParameter<any>[]>) =>
		(ns: string) =>
			paramsByNamespace[ns] ?? [];

	beforeEach(() => {
		batchParameterValueUpdate.mockClear();
	});

	it("returns error for unknown parameter", async () => {
		const result = await resolveAndUpdate(
			namespace,
			getParametersFor({[namespace]: []}),
			[{name: "Missing", value: 1}],
			batchParameterValueUpdate,
		);

		expect(result).toEqual({
			applied: [],
			errors: [
				{
					name: "Missing",
					message:
						'Parameter with id/name/displayname "Missing" does not exist.',
				},
			],
		});
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});

	it("applies valid update", async () => {
		const param = createMockParameter({
			definition: {
				id: "width",
				name: "Width",
				type: ResParameterType.FLOAT,
				min: 0,
				max: 100,
				defval: 10,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 10} as IShapeDiverParameter<any>["state"],
		});

		const result = await resolveAndUpdate(
			namespace,
			getParametersFor({[namespace]: [param]}),
			[{name: "Width", value: 42}],
			batchParameterValueUpdate,
		);

		expect(result).toEqual({applied: ["width"], errors: []});
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			[namespace]: {width: 42},
		});
	});

	it("returns error for invalid numeric value", async () => {
		const param = createMockParameter({
			definition: {
				id: "width",
				name: "Width",
				type: ResParameterType.FLOAT,
				min: 0,
				max: 100,
				defval: 10,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 10} as IShapeDiverParameter<any>["state"],
			actions: {
				isValid: () => false,
			} as IShapeDiverParameter<any>["actions"],
		});

		const result = await resolveAndUpdate(
			namespace,
			getParametersFor({[namespace]: [param]}),
			[{name: "Width", value: 200}],
			batchParameterValueUpdate,
		);

		expect(result).toEqual({
			applied: [],
			errors: [
				{
					name: "Width",
					message: "Value 200 is out of range [0, 100].",
				},
			],
		});
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});

	it("returns error for duplicate parameter updates", async () => {
		const param = createMockParameter({
			definition: {
				id: "width",
				name: "Width",
				type: ResParameterType.FLOAT,
				min: 0,
				max: 100,
				defval: 10,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 10} as IShapeDiverParameter<any>["state"],
		});

		const result = await resolveAndUpdate(
			namespace,
			getParametersFor({[namespace]: [param]}),
			[
				{name: "Width", value: 20},
				{name: "width", value: 30},
			],
			batchParameterValueUpdate,
		);

		expect(result.errors).toEqual([
			{
				name: "width",
				message: 'Refusing to update parameter "width" twice.',
			},
		]);
		expect(result.applied).toEqual(["width"]);
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			[namespace]: {width: 20},
		});
	});

	it("composes COLOR object and applies when valid", async () => {
		const composeSpy = jest.spyOn(
			await import("@AppBuilderLib/shared/lib/colors"),
			"composeSdColor",
		);
		const colorValue = {red: 10, green: 20, blue: 30, alpha: 255};
		const composed = composeSdColor(colorValue);

		const param = createMockParameter({
			definition: {
				id: "paint",
				name: "Paint",
				type: ResParameterType.COLOR,
				defval: "0x000000ff",
			} as IShapeDiverParameter<any>["definition"],
			state: {
				uiValue: "0x000000ff",
			} as IShapeDiverParameter<any>["state"],
			actions: {
				isValid: (value: unknown) => value === composed,
			} as IShapeDiverParameter<any>["actions"],
		});

		const result = await resolveAndUpdate(
			namespace,
			getParametersFor({[namespace]: [param]}),
			[{name: "Paint", value: colorValue}],
			batchParameterValueUpdate,
		);

		expect(composeSpy).toHaveBeenCalledWith(colorValue);
		expect(result).toEqual({applied: ["paint"], errors: []});
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			[namespace]: {paint: composed},
		});

		composeSpy.mockRestore();
	});

	it("rejects color object for non-color parameter", async () => {
		const param = createMockParameter({
			definition: {
				id: "width",
				name: "Width",
				type: ResParameterType.FLOAT,
				min: 0,
				max: 100,
				defval: 10,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 10} as IShapeDiverParameter<any>["state"],
		});

		const result = await resolveAndUpdate(
			namespace,
			getParametersFor({[namespace]: [param]}),
			[
				{
					name: "Width",
					value: {red: 1, green: 2, blue: 3, alpha: 4},
				},
			],
			batchParameterValueUpdate,
		);

		expect(result).toEqual({
			applied: [],
			errors: [
				{
					name: "Width",
					message:
						"Color object value is only valid for Color parameters.",
				},
			],
		});
	});

	it("applies StringList index as number (stored as string)", async () => {
		const isValid = jest.fn((value: unknown) => value === "1");
		const param = createMockParameter({
			definition: {
				id: "material",
				name: "Material",
				type: ResParameterType.STRINGLIST,
				choices: ["Wood", "Metal"],
				defval: 0,
			} as unknown as IShapeDiverParameter<any>["definition"],
			state: {uiValue: "0"} as IShapeDiverParameter<any>["state"],
			actions: {isValid} as IShapeDiverParameter<any>["actions"],
		});

		const result = await resolveAndUpdate(
			namespace,
			getParametersFor({[namespace]: [param]}),
			[{name: "Material", value: 1}],
			batchParameterValueUpdate,
		);

		expect(isValid).toHaveBeenCalledWith("1", false);
		expect(result).toEqual({applied: ["material"], errors: []});
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			[namespace]: {material: "1"},
		});
	});

	it("looks up parameters in update sessionId namespace", async () => {
		const childNamespace = "child-session";
		const mainParam = createMockParameter({
			definition: {
				id: "width",
				name: "Width",
				type: ResParameterType.FLOAT,
				min: 0,
				max: 100,
				defval: 10,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 10} as IShapeDiverParameter<any>["state"],
		});
		const childParam = createMockParameter({
			definition: {
				id: "height",
				name: "Height",
				type: ResParameterType.FLOAT,
				min: 0,
				max: 100,
				defval: 20,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 20} as IShapeDiverParameter<any>["state"],
		});
		const getParameters = jest.fn((ns: string) => {
			if (ns === namespace) {
				return [mainParam];
			}
			if (ns === childNamespace) {
				return [childParam];
			}

			return [];
		});

		const result = await resolveAndUpdate(
			namespace,
			getParameters,
			[{name: "Height", sessionId: childNamespace, value: 55}],
			batchParameterValueUpdate,
		);

		expect(getParameters).toHaveBeenCalledWith(childNamespace);
		expect(result).toEqual({applied: ["height"], errors: []});
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			[childNamespace]: {height: 55},
		});
	});

	it("reports missing parameter in target sessionId namespace", async () => {
		const childNamespace = "child-session";
		const mainParam = createMockParameter({
			definition: {
				id: "width",
				name: "Width",
				type: ResParameterType.FLOAT,
				min: 0,
				max: 100,
				defval: 10,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 10} as IShapeDiverParameter<any>["state"],
		});
		const getParameters = jest.fn((ns: string) =>
			ns === namespace ? [mainParam] : [],
		);

		const result = await resolveAndUpdate(
			namespace,
			getParameters,
			[{name: "Width", sessionId: childNamespace, value: 42}],
			batchParameterValueUpdate,
		);

		expect(getParameters).toHaveBeenCalledWith(childNamespace);
		expect(result).toEqual({
			applied: [],
			errors: [
				{
					name: "Width",
					message:
						'Parameter with id/name/displayname "Width" does not exist.',
				},
			],
		});
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});
});
