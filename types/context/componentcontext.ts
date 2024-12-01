import { ReactElement } from "react";
import { PropsExport } from "../components/shapediver/propsExport";
import { PropsParameter } from "../components/shapediver/propsParameter";
import { ViewportComponentProps } from "../shapediver/viewport";
import { OverlayStyleProps } from "shared/components/shapediver/ui/OverlayWrapper";
import { ViewportOverlayWrapperProps } from "../shapediver/viewportOverlayWrapper";
import { ViewportIconsProps, ViewportIconsOptionalProps } from "../shapediver/viewportIcons";

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

	component: (props: any) => ReactElement

	// #endregion Properties (1)
}

/**
 * Type alias for the export component map value type.
 */
export interface ExportComponentMapValueType extends ComponentType {
	// #region Properties (1)

	component: (props: PropsExport) => ReactElement

	// #endregion Properties (1)
}

export interface IComponentContext {
	// #region Properties (6)

	exports: { [key: string]: ExportComponentMapValueType },
	parameters: { [key: string]: ParameterComponentMapValueType | { [key: string]: ParameterComponentMapValueType } },
	viewportCallbacks?: {
		[key: string]: {
			/** Function to convert the viewport to glTF */
			convertToGlTF?: () => Promise<Blob | undefined>,
			/** Function to create a screenshot */
			getScreenshot?: () => Promise<string | undefined>,
		}
	}
	viewportComponent?: ViewportComponentMapValueType,
	viewportIcons?: ViewportIconsComponentMapValueType,
	viewportOverlayWrapper?: ViewportOverlayWrapperComponentMapValueType,

	// #endregion Properties (6)
}

/**
 * Type alias for the parameter component map value type.
 */
export interface ParameterComponentMapValueType extends ComponentType {
	// #region Properties (2)

	/** Parameter component */
	component: (props: PropsParameter) => ReactElement,
	/** Defines whether extra bottom padding is required */
	extraBottomPadding: boolean,

	// #endregion Properties (2)
}

/**
 * Type alias for the viewport component map value type.
 */
export interface ViewportComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Viewport component */
	component: (props: ViewportComponentProps) => ReactElement,

	// #endregion Properties (1)
}

/**
 * Type alias for the viewport icons component map value type.
 */
export interface ViewportIconsComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Viewport icons component */
	component: (props: ViewportIconsProps & Partial<ViewportIconsOptionalProps>) => ReactElement,

	// #endregion Properties (1)
}

/**
 * Type alias for the viewport overlay wrapper component map value type.
 */
export interface ViewportOverlayWrapperComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Viewport overlay wrapper component */
	component: (props: ViewportOverlayWrapperProps & Partial<OverlayStyleProps>) => ReactElement,

	// #endregion Properties (1)
}

// #endregion Interfaces (7)