import {
	IComponentContext,
	ParameterComponentMapValueType,
} from "@AppBuilderShared/types/context/componentcontext";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import {createContext} from "react";
import ExportButtonComponent from "~/shared/components/shapediver/exports/ExportButtonComponent";
import ExportLabelComponent from "~/shared/components/shapediver/exports/ExportLabelComponent";
import ParameterBooleanComponent from "~/shared/components/shapediver/parameter/ParameterBooleanComponent";
import ParameterColorComponent from "~/shared/components/shapediver/parameter/ParameterColorComponent";
import ParameterFileInputComponent from "~/shared/components/shapediver/parameter/ParameterFileInputComponent";
import ParameterLabelComponent from "~/shared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterSelectComponent from "~/shared/components/shapediver/parameter/ParameterSelectComponent";
import ParameterSliderComponent from "~/shared/components/shapediver/parameter/ParameterSliderComponent";
import ParameterStargateComponent from "~/shared/components/shapediver/parameter/ParameterStargateComponent";
import ParameterStringComponent from "~/shared/components/shapediver/parameter/ParameterStringComponent";
import ArButton from "~/shared/components/shapediver/viewport/buttons/ArButton";
import CamerasButton from "~/shared/components/shapediver/viewport/buttons/CamerasButton";
import FullscreenButton from "~/shared/components/shapediver/viewport/buttons/FullscreenButton";
import HistoryMenuButton from "~/shared/components/shapediver/viewport/buttons/HistoryMenuButton";
import RedoButton from "~/shared/components/shapediver/viewport/buttons/RedoButton";
import ReloadButton from "~/shared/components/shapediver/viewport/buttons/ReloadButton";
import UndoButton from "~/shared/components/shapediver/viewport/buttons/UndoButton";
import ZoomButton from "~/shared/components/shapediver/viewport/buttons/ZoomButton";
import {PARAMETER_TYPE_STARGATE_DUMMY} from "~/shared/types/components/shapediver/componentTypes";
import {IShapeDiverParamOrExportDefinition} from "~/shared/types/shapediver/common";
import {ViewportIconButtonEnum} from "~/shared/types/store/shapediverStoreViewportIcons";

export const DummyComponent: IComponentContext = {};

export const ComponentContext =
	createContext<IComponentContext>(DummyComponent);

export const ViewportTypeToIcon = {
	[ViewportIconButtonEnum.Ar]: ArButton,
	[ViewportIconButtonEnum.Zoom]: ZoomButton,
	[ViewportIconButtonEnum.Fullscreen]: FullscreenButton,
	[ViewportIconButtonEnum.Cameras]: CamerasButton,
	[ViewportIconButtonEnum.Undo]: UndoButton,
	[ViewportIconButtonEnum.Redo]: RedoButton,
	[ViewportIconButtonEnum.Reload]: ReloadButton,
	[ViewportIconButtonEnum.HistoryMenu]: HistoryMenuButton,
};
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
