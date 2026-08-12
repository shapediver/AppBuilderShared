import {PropsExportWithForm} from "@AppBuilderLib/entities/export/config/propsExport";
import {ModelCardOverlayPropsType} from "@AppBuilderLib/entities/model-card/ui/ModelCardOverlay";
import {
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {ViewportComponentProps} from "@AppBuilderLib/entities/viewport/config/viewport";
import {ViewportOverlayWrapperProps} from "@AppBuilderLib/entities/viewport/config/viewportOverlayWrapper";
import {OverlayStyleProps} from "@AppBuilderLib/shared/ui/overlay/OverlayWrapper";
import {MantineThemeComponent} from "@mantine/core";
import {ReactElement} from "react";
import {
	IAppBuilder,
	IAppBuilderActionDefinition,
	IAppBuilderSettingsSession,
	IAppBuilderWidget,
} from "./appbuilder";
import type {ResolvedToolbarRegistration} from "./toolbarRenderTypes";

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

	component: (props: any) => ReactElement | null;

	// #endregion Properties (1)
}

/**
 * Type alias for the export component map value type.
 */
export interface ExportComponentMapValueType extends ComponentType {
	// #region Properties (1)

	component: (props: PropsExportWithForm) => ReactElement | null;

	// #endregion Properties (1)
}
/**
 * Type alias for model card overlays.
 */
export interface ModelCardOverlayType extends ComponentType {
	// #region Properties (1)

	component: (props: ModelCardOverlayPropsType) => ReactElement;

	// #endregion Properties (1)
}

//IModelCardOverlayProps

export interface IComponentContext {
	// #region Properties (6)

	exports?: {[key: string]: ExportComponentMapValueType};
	parameters?: {
		[key: string]:
			| ParameterComponentMapValueType
			| {[key: string]: ParameterComponentMapValueType};
	};
	viewportAnchors?: {[key: string]: ViewportAnchorComponentMapValueType};
	viewportComponent?: ViewportComponentMapValueType;
	appBuilderToolbarLayer?: AppBuilderToolbarLayerComponentMapValueType;
	viewportOverlayWrapper?: ViewportOverlayWrapperComponentMapValueType;
	widgets?: {[key: string]: WidgetComponentMapValueType};
	actions?: {[key: string]: ActionComponentMapValueType};
	modelCardOverlay?: ModelCardOverlayType;
	/** Component for rendering app builder containers (e.g. anchors). Injected from widgets layer to avoid circular dependencies. */
	containerComponent?: (props: any) => ReactElement | null;
	/** Component for rendering the fallback container when no app builder output is available. Injected from widgets layer to avoid circular dependencies. */
	fallbackContainerComponent?: (props: any) => ReactElement | null;

	// #endregion Properties (6)
}

export interface ViewportAnchorComponentMapValueType extends ComponentType {
	// #region Properties (2)

	/** Viewport anchor component */
	component: (props: any) => ReactElement | null;
	/** Theme properties for the viewport anchor */
	themeProps: (props: any) => MantineThemeComponent;

	// #endregion Properties (2)
}

export interface WidgetComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Widget component */
	component: (props: any) => ReactElement;
	/** Defines whether the widget is of this type */
	isComponent: (widget: IAppBuilderWidget) => boolean;
	/** Theme properties dictionary for the widget */
	themeProps?: Record<string, (props: any) => MantineThemeComponent>;

	// #endregion Properties (1)
}

export interface ActionComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Action component */
	component: (props: any) => ReactElement;
	/** Defines whether the action is of this type */
	isAction: (action: IAppBuilderActionDefinition) => boolean;

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

export interface AppBuilderToolbarLayerComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Optional viewport toolbar layer. Apps can omit it to avoid viewport toolbar dependencies. */
	component: (props: {
		namespace: string;
		appBuilderData?: IAppBuilder;
		sessionSettings?: IAppBuilderSettingsSession;
		viewportId?: string;
		onToolbarsChange?: (toolbars: ResolvedToolbarRegistration[]) => void;
	}) => ReactElement | null;

	// #endregion Properties (1)
}

/**
 * Type alias for the viewport overlay wrapper component map value type.
 */
export interface ViewportOverlayWrapperComponentMapValueType extends ComponentType {
	// #region Properties (1)

	/** Viewport overlay wrapper component */
	component: (
		props: ViewportOverlayWrapperProps & Partial<OverlayStyleProps>,
	) => ReactElement;

	// #endregion Properties (1)
}

// #endregion Interfaces (7)
