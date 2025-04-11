import {OverlayStyleProps} from "@AppBuilderShared/components/shapediver/ui/OverlayWrapper";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IAppBuilderWidget} from "@AppBuilderShared/types/shapediver/appbuilder";
import {ViewportComponentProps} from "@AppBuilderShared/types/shapediver/viewport";
import {
	ViewportIconsOptionalProps,
	ViewportIconsProps,
} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {ViewportOverlayWrapperProps} from "@AppBuilderShared/types/shapediver/viewportOverlayWrapper";
import {ReactElement} from "react";

// #region Interfaces (7)

/**
 * Type alias for the component map value type.
 *
 * Each value in the component map is an object with the following properties:
 * - `component`: The component to render.
 * - `data`: Additional data for the component. This can be separate props or functions.
 */
interface ComponentType {
	// #region Properties (1)

	component: (props: any) => ReactElement;

	// #endregion Properties (1)
}

/**
 * Type alias for the export component map value type.
 */
export interface ExportComponentMapValueType extends ComponentType {
	// #region Properties (1)

	component: (props: PropsExport) => ReactElement;

	// #endregion Properties (1)
}

export interface IComponentContext {
	// #region Properties (6)

	exports?: {[key: string]: ExportComponentMapValueType};
	parameters?: {
		[key: string]:
			| ParameterComponentMapValueType
			| {[key: string]: ParameterComponentMapValueType};
	};
	viewportComponent?: ViewportComponentMapValueType;
	viewportIcons?: ViewportIconsComponentMapValueType;
	viewportOverlayWrapper?: ViewportOverlayWrapperComponentMapValueType;
	widgets?: {[key: string]: WidgetComponentMapValueType};

	// #endregion Properties (6)
}

export interface WidgetComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Widget component */
	component: (props: any) => ReactElement;
	/** Defines whether the widget is of this type */
	isComponent: (widget: IAppBuilderWidget) => boolean;

	// #endregion Properties (1)
}

/**
 * Type alias for the parameter component map value type.
 */
export interface ParameterComponentMapValueType extends ComponentType {
	// #region Properties (2)

	/** Parameter component */
	component: (
		props: PropsParameter & Partial<PropsParameterWrapper>,
	) => ReactElement;
	/** Defines whether extra bottom padding is required */
	extraBottomPadding: boolean;

	// #endregion Properties (2)
}

/**
 * Type alias for the viewport component map value type.
 */
export interface ViewportComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Viewport component */
	component: (props: ViewportComponentProps) => ReactElement;

	// #endregion Properties (1)
}

/**
 * Type alias for the viewport icons component map value type.
 */
export interface ViewportIconsComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Viewport icons component */
	component: (
		props: ViewportIconsProps & Partial<ViewportIconsOptionalProps>,
	) => ReactElement;

	// #endregion Properties (1)
}

/**
 * Type alias for the viewport overlay wrapper component map value type.
 */
export interface ViewportOverlayWrapperComponentMapValueType
	extends ComponentType {
	// #region Properties (1)

	/** Viewport overlay wrapper component */
	component: (
		props: ViewportOverlayWrapperProps & Partial<OverlayStyleProps>,
	) => ReactElement;

	// #endregion Properties (1)
}

// #endregion Interfaces (7)
