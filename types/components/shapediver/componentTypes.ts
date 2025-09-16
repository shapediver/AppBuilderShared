import ExportButtonComponent from "@AppBuilderShared/components/shapediver/exports/ExportButtonComponent";
import ExportLabelComponent from "@AppBuilderShared/components/shapediver/exports/ExportLabelComponent";
import ParameterBooleanComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterBooleanComponent";
import ParameterColorComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterColorComponent";
import ParameterFileInputComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterFileInputComponent";
import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterSelectComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSelectComponent";
import ParameterSliderComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSliderComponent";
import ParameterStargateComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterStargateComponent";
import ParameterStringComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterStringComponent";
import ArButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ArButton";
import CamerasButton from "@AppBuilderShared/components/shapediver/viewport/buttons/CamerasButton";
import FullscreenButton from "@AppBuilderShared/components/shapediver/viewport/buttons/FullscreenButton";
import HistoryMenuButton from "@AppBuilderShared/components/shapediver/viewport/buttons/HistoryMenuButton";
import RedoButton from "@AppBuilderShared/components/shapediver/viewport/buttons/RedoButton";
import ReloadButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ReloadButton";
import {CommonButtonProps} from "@AppBuilderShared/components/shapediver/viewport/buttons/types";
import UndoButton from "@AppBuilderShared/components/shapediver/viewport/buttons/UndoButton";
import ZoomButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ZoomButton";
import {
	IComponentContext,
	ParameterComponentMapValueType,
} from "@AppBuilderShared/types/context/componentcontext";
import {IShapeDiverParamOrExportDefinition} from "@AppBuilderShared/types/shapediver/common";
import {
	ViewportIconButtonEnum,
	ViewportIconLayoutItem,
} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {Divider, DividerProps} from "@mantine/core";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {EXPORT_TYPE, PARAMETER_TYPE} from "@shapediver/viewer.session";
import React from "react";

const PARAMETER_TYPE_STARGATE_DUMMY = "Stargate";

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

const ViewportTypeToIcon = {
	[ViewportIconButtonEnum.Ar]: ArButton,
	[ViewportIconButtonEnum.Zoom]: ZoomButton,
	[ViewportIconButtonEnum.Fullscreen]: FullscreenButton,
	[ViewportIconButtonEnum.Cameras]: CamerasButton,
	[ViewportIconButtonEnum.Undo]: UndoButton,
	[ViewportIconButtonEnum.Redo]: RedoButton,
	[ViewportIconButtonEnum.Reload]: ReloadButton,
	[ViewportIconButtonEnum.HistoryMenu]: HistoryMenuButton,
};

export interface ButtonRenderContext extends CommonButtonProps {
	viewport?: any;
	namespace?: string;
	buttonsDisabled: boolean;
	executing: boolean;
	hasPendingChanges: boolean;
	iconsVisible: boolean;
	fullscreenId: string;
}

export const renderButtonByKind = (
	kind: ViewportIconButtonEnum,
	context: any,
) => {
	const {
		viewport,
		namespace,
		buttonsDisabled,
		executing,
		hasPendingChanges,
		iconsVisible,
		fullscreenId,
		...commonProps
	} = context;

	switch (kind) {
		case ViewportIconButtonEnum.Ar:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Ar],
				{key: "ar", viewport, ...commonProps},
			);
		case ViewportIconButtonEnum.Zoom:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Zoom],
				{key: "zoom", viewport, ...commonProps},
			);
		case ViewportIconButtonEnum.Fullscreen:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Fullscreen],
				{
					key: "fullscreen",
					fullscreenId,
					enableFullscreenBtn: true,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Cameras:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Cameras],
				{
					key: "cameras",
					viewport,
					visible: iconsVisible,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Undo:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Undo],
				{
					key: "undo",
					disabled: buttonsDisabled || executing || hasPendingChanges,
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Redo:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Redo],
				{
					key: "redo",
					disabled: buttonsDisabled || executing || hasPendingChanges,
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.Reload:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.Reload],
				{
					key: "reload",
					disabled:
						!namespace ||
						buttonsDisabled ||
						executing ||
						hasPendingChanges,
					namespace: namespace || "",
					hasPendingChanges,
					executing,
					...commonProps,
				},
			);
		case ViewportIconButtonEnum.HistoryMenu:
			return React.createElement(
				ViewportTypeToIcon[ViewportIconButtonEnum.HistoryMenu],
				{
					key: "historyMenu",
					disabled:
						!namespace || buttonsDisabled || hasPendingChanges,
					namespace: namespace || "",
					visible: iconsVisible,
					...commonProps,
				},
			);
		default:
			return null;
	}
};

export const renderViewportIcons = (
	viewportIcons: ViewportIconLayoutItem[],
	buttonContext: ButtonRenderContext,
	dividerProps: DividerProps = {},
) => {
	const sections: React.ReactNode[] = [];
	if (viewportIcons.length === 0) return sections;

	viewportIcons.forEach((item, index) => {
		if (item.type === "button") {
			const button = renderButtonByKind(item.button.type, buttonContext);
			if (button) sections.push(button);
		} else if (item.type === "group") {
			const groupButtons: React.ReactNode[] = [];
			item.sections.forEach((section) => {
				section.forEach((buttonDef) => {
					const button = renderButtonByKind(
						buttonDef.type,
						buttonContext,
					);
					if (button) groupButtons.push(button);
				});
				// Add divider between sections within a group
				if (
					groupButtons.length > 0 &&
					section !== item.sections[item.sections.length - 1]
				) {
					groupButtons.push(
						React.createElement(Divider, {
							key: `divider-${index}-${section.length}`,
							...dividerProps,
						}),
					);
				}
			});
			sections.push(
				React.createElement(
					React.Fragment,
					{key: `group-${index}`},
					...groupButtons,
				),
			);
		}

		// Add divider between layout items
		if (index < viewportIcons.length - 1) {
			sections.push(
				React.createElement(Divider, {
					key: `layout-divider-${index}`,
					...dividerProps,
				}),
			);
		}
	});

	return sections;
};
