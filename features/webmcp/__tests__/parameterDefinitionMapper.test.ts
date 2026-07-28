import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {mapParameterDefinition} from "../lib/parameterDefinitionMapper";

const SESSION_ID = "session-1";

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
			isValid: () => true,
			isUiValueDifferent: () => false,
			resetToDefaultValue: () => undefined,
			resetToExecValue: () => undefined,
		},
		acceptRejectMode: false,
		...overrides,
	} as IShapeDiverParameter<any>;
}

describe("mapParameterDefinition", () => {
	it("maps STRINGLIST with index current/default values", () => {
		const param = createMockParameter({
			definition: {
				id: "list-1",
				name: "Material",
				type: ResParameterType.STRINGLIST,
				choices: ["Wood", "Metal"],
				defval: 1,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 0} as IShapeDiverParameter<any>["state"],
		});

		expect(mapParameterDefinition(param, SESSION_ID)).toEqual({
			id: "list-1",
			sessionId: SESSION_ID,
			name: "Material",
			type: ResParameterType.STRINGLIST,
			howto: "Use a 0-based integer index (0..1). Choices: [\"Wood\",\"Metal\"]. Never send the label text. Never wrap in {index:N}. If choices look like numbers (e.g. ['4','6','8'] or ['3','3 1/4',...]) the value is still the INDEX, not the label — '6 prongs' = index 1, not value 6; finger size '7' = index 16, not value 7. Match choice labels case-insensitively to find the index (e.g. 'Button' matches 'button' = index 0), then send the index.",
			settable: true,
			choices: ["Wood", "Metal"],
			currentValue: 0,
			defaultValue: 1,
		});
	});

	it("maps COLOR with decomposed values", () => {
		const param = createMockParameter({
			definition: {
				id: "color-1",
				name: "Paint",
				type: ResParameterType.COLOR,
				defval: "0xff0000ff",
			} as IShapeDiverParameter<any>["definition"],
			state: {
				uiValue: "0x00ff00ff",
			} as IShapeDiverParameter<any>["state"],
		});

		expect(mapParameterDefinition(param, SESSION_ID)).toEqual({
			id: "color-1",
			sessionId: SESSION_ID,
			name: "Paint",
			type: ResParameterType.COLOR,
			howto: "Use a color object {red, green, blue, alpha} (0-255). Never send a hex string or color name.",
			settable: true,
			currentValue: {red: 0, green: 255, blue: 0, alpha: 255},
			defaultValue: {red: 255, green: 0, blue: 0, alpha: 255},
		});
	});

	it("maps FLOAT with min/max/decimalplaces", () => {
		const param = createMockParameter({
			definition: {
				id: "float-1",
				name: "Width",
				type: ResParameterType.FLOAT,
				min: 0,
				max: 100,
				decimalplaces: 2,
				defval: 10,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 42.5} as IShapeDiverParameter<any>["state"],
		});

		expect(mapParameterDefinition(param, SESSION_ID)).toEqual({
			id: "float-1",
			sessionId: SESSION_ID,
			name: "Width",
			type: ResParameterType.FLOAT,
			howto: "Use a number in range [0, 100]. Tool validates min/max; out-of-range values are rejected.",
			settable: true,
			min: 0,
			max: 100,
			decimalplaces: 2,
			currentValue: 42.5,
			defaultValue: 10,
		});
	});

	it("maps BOOL", () => {
		const param = createMockParameter({
			definition: {
				id: "bool-1",
				name: "Enabled",
				type: ResParameterType.BOOL,
				defval: false,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: true} as IShapeDiverParameter<any>["state"],
		});

		expect(mapParameterDefinition(param, SESSION_ID)).toEqual({
			id: "bool-1",
			sessionId: SESSION_ID,
			name: "Enabled",
			type: ResParameterType.BOOL,
			howto: 'Use a boolean. Never send 0/1 or "true"/"false" strings.',
			settable: true,
			currentValue: true,
			defaultValue: false,
		});
	});

	it("includes group and tooltip from definition", () => {
		const param = createMockParameter({
			definition: {
				id: "p1",
				name: "width",
				displayname: "Width",
				type: ResParameterType.INT,
				min: 0,
				max: 10,
				defval: 5,
				group: {name: "Dimensions"},
				tooltip: "Model width",
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 7} as IShapeDiverParameter<any>["state"],
		});

		expect(mapParameterDefinition(param, SESSION_ID)).toEqual({
			id: "p1",
			sessionId: SESSION_ID,
			name: "Width",
			type: ResParameterType.INT,
			howto: "Use an integer in range [0, 10]. Tool validates min/max and integer-ness; out-of-range or non-integer values are rejected.",
			settable: true,
			group: "Dimensions",
			tooltip: "Model width",
			min: 0,
			max: 10,
			currentValue: 7,
			defaultValue: 5,
		});
	});

	it("marks unsupported types as not settable", () => {
		const param = createMockParameter({
			definition: {
				id: "file-1",
				name: "Upload",
				type: ResParameterType.FILE,
			} as IShapeDiverParameter<any>["definition"],
		});

		expect(mapParameterDefinition(param, SESSION_ID)).toEqual({
			id: "file-1",
			sessionId: SESSION_ID,
			name: "Upload",
			type: ResParameterType.FILE,
			howto: "Read-only: this parameter type is not supported by set_parameter_values.",
			settable: false,
		});
	});
});
