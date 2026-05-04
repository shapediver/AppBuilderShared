import {
	ExportButtonComponent,
	ExportLabelComponent,
} from "@AppBuilderLib/entities/export";
import {IShapeDiverParamOrExportDefinition} from "@AppBuilderLib/entities/parameter/config/common";
import ParameterBooleanComponent from "@AppBuilderLib/entities/parameter/ui/ParameterBooleanComponent";
import ParameterColorComponent from "@AppBuilderLib/entities/parameter/ui/ParameterColorComponent";
import ParameterFileInputComponent from "@AppBuilderLib/entities/parameter/ui/ParameterFileInputComponent";
import ParameterLabelComponent from "@AppBuilderLib/entities/parameter/ui/ParameterLabelComponent";
import ParameterSelectComponent from "@AppBuilderLib/entities/parameter/ui/ParameterSelectComponent";
import ParameterSliderComponent from "@AppBuilderLib/entities/parameter/ui/ParameterSliderComponent";
import ParameterStargateComponent from "@AppBuilderLib/entities/parameter/ui/ParameterStargateComponent";
import ParameterStringComponent from "@AppBuilderLib/entities/parameter/ui/ParameterStringComponent";
import {
	CommonButtonProps,
	ViewportIconButtonEnum,
} from "@AppBuilderLib/entities/viewport";
import {
	IComponentContext,
	ParameterComponentMapValueType,
} from "@AppBuilderLib/features/appbuilder";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";

export const PARAMETER_TYPE_STARGATE_DUMMY = "Stargate";

export const isStargateParameter = (type: ResParameterType) => {
	return type && type[0] === "s";
};

const defaultParameterComponentContext: IComponentContext["parameters"] = {
	[PARAMETER_TYPE.INT]: {
		component: ParameterSliderComponent,
		extraBottomPadding: true,
	},
	[PARAMETER_TYPE.FLOAT]: {
		component: ParameterSliderComponent,
		extraBottomPadding: true,
	},
	[PARAMETER_TYPE.EVEN]: {
		component: ParameterSliderComponent,
		extraBottomPadding: true,
	},
	[PARAMETER_TYPE.ODD]: {
		component: ParameterSliderComponent,
		extraBottomPadding: true,
	},
	[PARAMETER_TYPE.BOOL]: {
		component: ParameterBooleanComponent,
		extraBottomPadding: false,
	},
	[PARAMETER_TYPE.STRING]: {
		component: ParameterStringComponent,
		extraBottomPadding: false,
	},
	[PARAMETER_TYPE.STRINGLIST]: {
		component: ParameterSelectComponent,
		extraBottomPadding: false,
	},
	[PARAMETER_TYPE.COLOR]: {
		component: ParameterColorComponent,
		extraBottomPadding: false,
	},
	[PARAMETER_TYPE.FILE]: {
		component: ParameterFileInputComponent,
		extraBottomPadding: false,
	},
	[PARAMETER_TYPE.DRAWING]: {
		component: ParameterStringComponent,
		extraBottomPadding: true,
	},
	[PARAMETER_TYPE.INTERACTION]: {
		selection: {
			component: ParameterStringComponent,
			extraBottomPadding: false,
		},
		gumball: {
			component: ParameterStringComponent,
			extraBottomPadding: false,
		},
		dragging: {
			component: ParameterStringComponent,
			extraBottomPadding: false,
		},
		rectangleTransform: {
			component: ParameterStringComponent,
			extraBottomPadding: true,
		},
	},
	[PARAMETER_TYPE_STARGATE_DUMMY]: {
		component: ParameterStargateComponent,
		extraBottomPadding: false,
	},
};

export const getParameterComponent = (
	context: IComponentContext,
	definition: IShapeDiverParamOrExportDefinition,
): ParameterComponentMapValueType => {
	const type = definition.type;
	let component = context.parameters?.[type];

	// check if the component is already a component or a map
	if (type === PARAMETER_TYPE.INTERACTION) {
		component = (
			component as
				| {[key: string]: ParameterComponentMapValueType}
				| undefined
		)?.[definition.settings.type];
		if (!component)
			component = (
				defaultParameterComponentContext[type] as {
					[key: string]: ParameterComponentMapValueType;
				}
			)[definition.settings.type];
	} else {
		component = component as ParameterComponentMapValueType | undefined;
		if (!component)
			component = defaultParameterComponentContext[
				type
			] as ParameterComponentMapValueType;
	}

	if (!component && isStargateParameter(type as ResParameterType)) {
		component = defaultParameterComponentContext[
			PARAMETER_TYPE_STARGATE_DUMMY
		] as ParameterComponentMapValueType;
	}

	if (component) {
		return {
			component: component.component,
			extraBottomPadding: component.extraBottomPadding,
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

export const getExportComponent = (
	context: IComponentContext,
	definition: IShapeDiverParamOrExportDefinition,
) => {
	const type = definition.type;

	if (context.exports?.[type]) {
		return context.exports[type].component;
	} else {
		return (
			defaultExportComponentContext[type].component ||
			ExportLabelComponent
		);
	}
};

export const getViewportIconComponent = (
	context: IComponentContext,
	type: ViewportIconButtonEnum,
) => {
	const component = context.viewportIconButtons?.[type];
	return component?.component;
};

export interface ButtonRenderContext extends CommonButtonProps {
	viewport?: any;
	namespace: string;
	buttonsDisabled: boolean;
	executing: boolean;
	hasPendingChanges: boolean;
	iconsVisible: boolean;
	fullscreenId: string;
	disabled?: boolean;
}
