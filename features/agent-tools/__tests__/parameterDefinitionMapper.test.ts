import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {mapParameterDefinition} from "../lib/parameterDefinitionMapper";

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
			setExecutedValue: () => true,
			setResetValue: () => undefined,
			execute: async () => "",
			isValid: () => true,
			isUiValueDifferent: () => false,
			resetToDefaultValue: () => undefined,
			resetToCommitValue: () => undefined,
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

		expect(mapParameterDefinition(param)).toEqual({
			id: "list-1",
			name: "Material",
			type: ResParameterType.STRINGLIST,
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

		expect(mapParameterDefinition(param)).toEqual({
			id: "color-1",
			name: "Paint",
			type: ResParameterType.COLOR,
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

		expect(mapParameterDefinition(param)).toEqual({
			id: "float-1",
			name: "Width",
			type: ResParameterType.FLOAT,
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

		expect(mapParameterDefinition(param)).toEqual({
			id: "bool-1",
			name: "Enabled",
			type: ResParameterType.BOOL,
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

		expect(mapParameterDefinition(param)).toEqual({
			id: "p1",
			name: "Width",
			type: ResParameterType.INT,
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

		expect(mapParameterDefinition(param)).toEqual({
			id: "file-1",
			name: "Upload",
			type: ResParameterType.FILE,
			settable: false,
		});
	});
});
