import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {mapParameterDefinition} from "../lib/parameterDefinitionMapper";
import {howtoForParameterType, isHowtoTypeKnown} from "../lib/parameterHowto";

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
			howto: "Use a 0-based integer index (0..1). Choices: [\"Wood\",\"Metal\"]. Never send the label text. Never wrap in {index:N}. If choices look like numbers (e.g. ['4','6','8'] or ['3','3 1/4',...]) the value is still the INDEX, not the label — e.g. for choices ['4','6','8'], '6 prongs' = index 1, not value 6; for a label that is itself a number (e.g. '7'), find its position in choices and send that index, not the number itself. Match choice labels case-insensitively to find the index (e.g. 'Button' matches 'button' = index 0), then send the index.",
			settable: true,
			choices: ["Wood", "Metal"],
			currentValue: 0,
			defaultValue: 1,
		});
	});

	it("attaches choiceMetadata for STRINGLIST when provided", () => {
		const param = createMockParameter({
			definition: {
				id: "list-1",
				name: "Material",
				type: ResParameterType.STRINGLIST,
				choices: ["Apple"],
				defval: 0,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 0} as IShapeDiverParameter<any>["state"],
		});

		const result = mapParameterDefinition(param, SESSION_ID, {
			Apple: {description: "Crisp"},
		});
		expect(result.choiceMetadata).toEqual({
			Apple: {description: "Crisp"},
		});
	});

	it("omits choiceMetadata for STRINGLIST when not provided", () => {
		const param = createMockParameter({
			definition: {
				id: "list-1",
				name: "Material",
				type: ResParameterType.STRINGLIST,
				choices: ["Apple"],
				defval: 0,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 0} as IShapeDiverParameter<any>["state"],
		});

		expect(
			mapParameterDefinition(param, SESSION_ID).choiceMetadata,
		).toBeUndefined();
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

		const result = mapParameterDefinition(param, SESSION_ID);
		expect(result.settable).toBe(false);
		expect(result).not.toHaveProperty("currentValue");
		expect(result).not.toHaveProperty("hidden");
	});

	it("includes hidden when definition sets it", () => {
		const param = createMockParameter({
			definition: {
				id: "p1",
				name: "width",
				type: ResParameterType.INT,
				hidden: true,
				min: 1,
				max: 10,
				defval: 5,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 5} as IShapeDiverParameter<any>["state"],
		});
		expect(mapParameterDefinition(param, SESSION_ID).hidden).toBe(true);
	});

	it("omits tooltip when definition has none", () => {
		const param = createMockParameter({
			definition: {
				id: "p1",
				name: "width",
				type: ResParameterType.INT,
				min: 1,
				max: 10,
				defval: 5,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 5} as IShapeDiverParameter<any>["state"],
		});
		expect(mapParameterDefinition(param, SESSION_ID)).not.toHaveProperty(
			"tooltip",
		);
	});

	it("omits choiceMetadata when the metadata object is empty", () => {
		const param = createMockParameter({
			definition: {
				id: "list-1",
				name: "Material",
				type: ResParameterType.STRINGLIST,
				choices: ["Apple"],
				defval: 0,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 0} as IShapeDiverParameter<any>["state"],
		});
		expect(
			mapParameterDefinition(param, SESSION_ID, {}).choiceMetadata,
		).toBeUndefined();
	});

	it("maps STRING with max and without min", () => {
		const param = createMockParameter({
			definition: {
				id: "label",
				name: "Label",
				type: ResParameterType.STRING,
				max: 10,
				defval: "hi",
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: "hey"} as IShapeDiverParameter<any>["state"],
		});
		const result = mapParameterDefinition(param, SESSION_ID);
		expect(result).not.toHaveProperty("min");
		expect(result.max).toBe(10);
		expect(result.currentValue).toBe("hey");
		expect(result.howto).toMatch(/length <= 10/);
	});

	it("maps STRING without max", () => {
		const param = createMockParameter({
			definition: {
				id: "label",
				name: "Label",
				type: ResParameterType.STRING,
				defval: "hi",
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: "hey"} as IShapeDiverParameter<any>["state"],
		});
		const result = mapParameterDefinition(param, SESSION_ID);
		expect(result.howto).toMatch(/Use a string/);
		expect(result.howto).not.toMatch(/length <=/);
	});

	it("maps EVEN and ODD with non-zero min", () => {
		const even = createMockParameter({
			definition: {
				id: "even-1",
				name: "Even",
				type: ResParameterType.EVEN,
				min: 2,
				max: 10,
				defval: 4,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 4} as IShapeDiverParameter<any>["state"],
		});
		const odd = createMockParameter({
			definition: {
				id: "odd-1",
				name: "Odd",
				type: ResParameterType.ODD,
				min: 1,
				max: 9,
				defval: 3,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 3} as IShapeDiverParameter<any>["state"],
		});
		expect(mapParameterDefinition(even, SESSION_ID).howto).toMatch(
			/even integer/,
		);
		expect(mapParameterDefinition(even, SESSION_ID).min).toBe(2);
		expect(mapParameterDefinition(odd, SESSION_ID).howto).toMatch(
			/odd integer/,
		);
		expect(mapParameterDefinition(odd, SESSION_ID).min).toBe(1);
		expect(mapParameterDefinition(even, SESSION_ID).howto).toMatch(
			/\[2, 10\]/,
		);
	});

	it("maps FLOAT min when min is non-zero", () => {
		const param = createMockParameter({
			definition: {
				id: "float-1",
				name: "Width",
				type: ResParameterType.FLOAT,
				min: 5,
				max: 100,
				decimalplaces: 1,
				defval: 10,
			} as IShapeDiverParameter<any>["definition"],
			state: {uiValue: 10} as IShapeDiverParameter<any>["state"],
		});
		expect(mapParameterDefinition(param, SESSION_ID).min).toBe(5);
		expect(mapParameterDefinition(param, SESSION_ID).howto).toMatch(
			/\[5, 100\]/,
		);
	});
});

describe("isHowtoTypeKnown", () => {
	it("is true for settable types and false for others", () => {
		expect(isHowtoTypeKnown(ResParameterType.INT)).toBe(true);
		expect(isHowtoTypeKnown(ResParameterType.FLOAT)).toBe(true);
		expect(isHowtoTypeKnown(ResParameterType.EVEN)).toBe(true);
		expect(isHowtoTypeKnown(ResParameterType.ODD)).toBe(true);
		expect(isHowtoTypeKnown(ResParameterType.STRINGLIST)).toBe(true);
		expect(isHowtoTypeKnown(ResParameterType.COLOR)).toBe(true);
		expect(isHowtoTypeKnown(ResParameterType.BOOL)).toBe(true);
		expect(isHowtoTypeKnown(ResParameterType.STRING)).toBe(true);
		expect(isHowtoTypeKnown(ResParameterType.FILE)).toBe(false);
	});
});

describe("howtoForParameterType", () => {
	it("uses generic howto for unsupported types", () => {
		expect(
			howtoForParameterType({
				type: ResParameterType.FILE,
			} as IShapeDiverParameter<any>["definition"]),
		).toMatch(/valid for this parameter type/);
	});

	it("STRINGLIST without choices uses empty list in howto", () => {
		expect(
			howtoForParameterType({
				type: ResParameterType.STRINGLIST,
			} as IShapeDiverParameter<any>["definition"]),
		).toContain("Choices: []");
	});
});
