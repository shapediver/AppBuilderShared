import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {IAppBuilderParameterRef} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {composeSdColor} from "@AppBuilderLib/shared/lib/colors";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";

export const EVAL_NAMESPACE = "eval-session";

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
	actions: {
		isValid: (value) =>
			typeof value === "number" && value >= 0 && value <= 10,
	} as IShapeDiverParameter<any>["actions"],
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
	actions: {
		isValid: (value) => {
			const index = typeof value === "number" ? value : Number(value);

			return (
				Number.isInteger(index) && index >= 0 && index < 3
			);
		},
	} as IShapeDiverParameter<any>["actions"],
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
