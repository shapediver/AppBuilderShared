import ExportButtonComponent from "@AppBuilderShared/components/shapediver/exports/ExportButtonComponent";
import ExportLabelComponent from "@AppBuilderShared/components/shapediver/exports/ExportLabelComponent";
import ParameterBooleanComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterBooleanComponent";
import ParameterColorComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterColorComponent";
import ParameterFileInputComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterFileInputComponent";
import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterSelectComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSelectComponent";
import ParameterSliderComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSliderComponent";
import ParameterStringComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterStringComponent";
import { IComponentContext, ParameterComponentMapValueType } from "@AppBuilderShared/types/context/componentcontext";
import { IShapeDiverParamOrExportDefinition } from "@AppBuilderShared/types/shapediver/common";
import { EXPORT_TYPE, PARAMETER_TYPE } from "@shapediver/viewer.session";

const defaultParameterComponentContext: IComponentContext["parameters"] = {
	[PARAMETER_TYPE.INT]: {component: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.FLOAT]: {component: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.EVEN]: {component: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.ODD]: {component: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.BOOL]: {component: ParameterBooleanComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.STRING]: {component: ParameterStringComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.STRINGLIST]: {component: ParameterSelectComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.COLOR]: {component: ParameterColorComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.FILE]: {component: ParameterFileInputComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.DRAWING]: {component: ParameterStringComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.INTERACTION]: {            
		"selection": {component: ParameterStringComponent, extraBottomPadding: false},
		"gumball": {component: ParameterStringComponent, extraBottomPadding: false},
		"dragging": {component: ParameterStringComponent, extraBottomPadding: false},
	}
};

export const getParameterComponent = (context: IComponentContext, definition: IShapeDiverParamOrExportDefinition): ParameterComponentMapValueType => {
	const type = definition.type;
	let component = context.parameters?.[type];

	// check if the component is already a component or a map
	if (type === PARAMETER_TYPE.INTERACTION){
		component = (component as { [key: string]: ParameterComponentMapValueType } | undefined)?.[definition.settings.type];
		if (!component) 
			component = (defaultParameterComponentContext[type] as { [key: string]: ParameterComponentMapValueType })[definition.settings.type];
	} else {
		component = component as ParameterComponentMapValueType | undefined;
		if (!component) 
			component = defaultParameterComponentContext[type] as ParameterComponentMapValueType;
	}

	if (component) {
		return {
			component: component.component,
			extraBottomPadding: component.extraBottomPadding
		};
	}

	return {
		component: ParameterLabelComponent,
		extraBottomPadding: false,
	};
};

const defaultExportComponentContext: IComponentContext["exports"] = {
	[EXPORT_TYPE.DOWNLOAD]: {component: ExportButtonComponent},
	[EXPORT_TYPE.EMAIL]: {component: ExportButtonComponent},
};

export const getExportComponent = (context: IComponentContext, definition: IShapeDiverParamOrExportDefinition) => {
	const type = definition.type;

	if (context.exports?.[type]) {
		return context.exports[type].component;
	} else {
		return defaultExportComponentContext[type].component || ExportLabelComponent;
	}
};
