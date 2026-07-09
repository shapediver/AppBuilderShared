import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {IAppBuilderParameterRef} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {composeSdColor} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";

export const EVAL_NAMESPACE = "eval-session";

function createIsValid(
	def: IShapeDiverParameter<any>["definition"],
): IShapeDiverParameter<any>["actions"]["isValid"] {
	return (value: unknown) => {
		const type = def.type;

		if (
			type === ResParameterType.INT ||
			type === ResParameterType.FLOAT ||
			type === ResParameterType.EVEN ||
			type === ResParameterType.ODD
		) {
			if (typeof value !== "number") {
				return false;
			}
			const min = def.min ?? Number.NEGATIVE_INFINITY;
			const max = def.max ?? Number.POSITIVE_INFINITY;

			return value >= min && value <= max;
		}

		if (type === ResParameterType.STRINGLIST) {
			if (typeof value !== "string" && typeof value !== "number") {
				return false;
			}
			const index = typeof value === "number" ? value : Number(value);
			const choices = def.choices ?? [];

			return (
				Number.isInteger(index) && index >= 0 && index < choices.length
			);
		}

		if (type === ResParameterType.COLOR) {
			return typeof value === "string" && value.length > 0;
		}

		if (type === ResParameterType.STRING) {
			if (typeof value !== "string") {
				return false;
			}
			if (def.max !== undefined) {
				return value.length <= def.max;
			}

			return true;
		}

		if (type === ResParameterType.BOOL) {
			return typeof value === "boolean";
		}

		return true;
	};
}

function createMockParameter(
	overrides: Partial<IShapeDiverParameter<any>> & {
		definition: IShapeDiverParameter<any>["definition"];
	},
): IShapeDiverParameter<any> {
	const isValid = createIsValid(overrides.definition);

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
			isValid,
			isUiValueDifferent: () => false,
			resetToDefaultValue: () => undefined,
			resetToExecValue: () => undefined,
		},
		acceptRejectMode: false,
		...overrides,
	} as IShapeDiverParameter<any>;
}

export const intParameter = createMockParameter({
	definition: {
		id: "width-int",
		name: "Width",
		displayname: "Width",
		type: ResParameterType.INT,
		min: 0,
		max: 10,
		defval: 5,
		group: {name: "Dimensions"},
		tooltip: "Model width",
	} as unknown as IShapeDiverParameter<any>["definition"],
	state: {uiValue: 5} as IShapeDiverParameter<any>["state"],
});

export const stringListParameter = createMockParameter({
	definition: {
		id: "material-list",
		name: "Material",
		type: ResParameterType.STRINGLIST,
		choices: ["Wood", "Metal", "Glass"],
		defval: 0,
	} as unknown as IShapeDiverParameter<any>["definition"],
	state: {uiValue: 1} as IShapeDiverParameter<any>["state"],
});

export const colorParameter = createMockParameter({
	definition: {
		id: "paint-color",
		name: "Paint",
		type: ResParameterType.COLOR,
		defval: composeSdColor({red: 0, green: 0, blue: 0, alpha: 255}),
	} as unknown as IShapeDiverParameter<any>["definition"],
	state: {
		uiValue: composeSdColor({red: 255, green: 0, blue: 0, alpha: 255}),
	} as IShapeDiverParameter<any>["state"],
});

export const floatParameter = createMockParameter({
	definition: {
		id: "height-float",
		name: "Height",
		type: ResParameterType.FLOAT,
		min: 0,
		max: 100,
		decimalplaces: 2,
		defval: 10,
	} as unknown as IShapeDiverParameter<any>["definition"],
	state: {uiValue: 42.5} as IShapeDiverParameter<any>["state"],
});

export const boolParameter = createMockParameter({
	definition: {
		id: "enabled-bool",
		name: "Enabled",
		type: ResParameterType.BOOL,
		defval: false,
	} as unknown as IShapeDiverParameter<any>["definition"],
	state: {uiValue: true} as IShapeDiverParameter<any>["state"],
});

/** Name says Color but type is StringList — common weak-model trap (SS-8076). */
export const colorNamedStringListParameter = createMockParameter({
	definition: {
		id: "color-list",
		name: "Color",
		type: ResParameterType.STRINGLIST,
		choices: ["Red", "Blue", "Green"],
		defval: 0,
	} as unknown as IShapeDiverParameter<any>["definition"],
	state: {uiValue: 7} as IShapeDiverParameter<any>["state"],
});

export const fileParameter = createMockParameter({
	definition: {
		id: "upload-file",
		name: "Upload",
		type: ResParameterType.FILE,
	} as unknown as IShapeDiverParameter<any>["definition"],
	state: {uiValue: ""} as IShapeDiverParameter<any>["state"],
});

export const allParameters: IShapeDiverParameter<any>[] = [
	intParameter,
	stringListParameter,
	colorParameter,
	floatParameter,
	boolParameter,
	colorNamedStringListParameter,
	fileParameter,
];

/** Refs for the "visible" list filter — width + paint only. */
export const parameterRefs: IAppBuilderParameterRef[] = [
	{name: "width-int"},
	{name: "Paint"},
];
