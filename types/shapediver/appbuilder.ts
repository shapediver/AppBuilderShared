import { IShapeDiverExportDefinition } from "./export";
import { IShapeDiverParameterDefinition } from "./parameter";
import { IconType } from "./icons";
import { SessionCreateDto } from "../store/shapediverStoreSession";
import { 
	IAppBuilderWidgetPropsAreaChart, 
	IAppBuilderWidgetPropsBarChart, 
	IAppBuilderWidgetPropsLineChart, 
	IAppBuilderWidgetPropsRoundChart 
} from "./appbuildercharts";

/** Type used for parameter definitions */
export type IAppBuilderParameterDefinition = IShapeDiverParameterDefinition & {
	/**
	 * The value to set for the generic parameter. Use this to update
	 * the parameter's current value (i.e. its state) without changing the 
	 * parameter definition. 
	 * In case no value is defined when creating a new generic parameter, 
	 * the new parameter's value is set to the default value defined in the 
	 * parameter definition.
	 */
	value?: string
};

/** Type used for export definitions */
export type IAppBuilderExportDefinition = IShapeDiverExportDefinition;

/** Reference to a parameter (custom or defined by the session) */
export interface IAppBuilderParameterRef {
	/** Id or name or displayname of the referenced parameter (in that order). */
	name: string
	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string
	/** Properties of the parameter to be overridden. */
	overrides?: Pick<Partial<IAppBuilderParameterDefinition>, "displayname" | "group" | "order" | "tooltip" | "hidden">
	/** Disable the UI element of the parameter if its state is dirty. */
	disableIfDirty?: boolean
	/** Ask the user to accept or reject changes of this parameter before executing them. */
	acceptRejectMode?: boolean
}

/** Reference to an export (defined by the session) */
export interface IAppBuilderExportRef {
	/** Id or name or displayname of the referenced export (in that order). */
	name: string
	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string
	/** Properties of the export to be overridden. */
	overrides?: Pick<Partial<IAppBuilderExportDefinition>, "displayname" | "group" | "order" | "tooltip" | "hidden">
}

/** Reference to an image */
export interface IAppBuilderImageRef {
	/** Optional reference to export which provides the image. */
	export?: Pick<IAppBuilderExportRef, "name" | "sessionId">
	/** URL to image. Can be a data URL including a base 64 encoded image. Takes precedence over export reference. */
	href?: string
}

/** Types of actions */
export type AppBuilderActionType = "createModelState" | "addToCart" | "setParameterValue" | "setBrowserLocation" | "closeConfigurator";

/** Common properties of App Builder actions. */
export interface IAppBuilderActionPropsCommon {
	/** Label (of the button etc). Optional, defaults to a value depending on the type of action. */
	label?: string
	/** Optional icon (of the button etc). */
	icon?: IconType
	/** Optional tooltip. */
	tooltip?: string
	// TODO: allow to define what should happen in case of success or error.
}

/** Properties of a "createModelState" action. */
export interface IAppBuilderActionPropsCreateModelState extends IAppBuilderActionPropsCommon {
	/**
	 * Optional flag to control whether an image of the scene shall be 
	 * included with the model state.
	 */
	includeImage?: boolean
	/** 
	 * Optional image to be included when creating the model state for the line item.
	 * In case no image is provided here, a screenshot of the model will be used
	 * if @see {@link includeImage} is set to true.
	 */
	image?: IAppBuilderImageRef
	/**
	 * Optional flag to control whether a glTF export of the scene shall be 
	 * included with the model state.
	 */
	includeGltf?: boolean
}

/** 
 * Properties of an "addToCart" action. 
 * This action triggers a corresponding message to the e-commerce system via the iframe API. 
 * A response is awaited and the result is displayed to the user. 
 */
export interface IAppBuilderActionPropsAddToCart extends IAppBuilderActionPropsCreateModelState {
	/** 
	 * Identifier of the product to add to the cart. 
	 * Optional, defaults to the product defined by the context. 
	 * Note that this productId is not necessarily the same as the id of the product 
	 * in the e-commerce system. Translations of product identifiers can be done by 
	 * the plug-in embedding App Builder in the respective e-commerce system. 
	 */
	productId?: string
	/** Quantity of the line item to add to the cart (number of units). Optional, defaults to 1. */
	quantity?: number
	/** Price of the product per unit. */
	price?: number
	/** Description to be used for the line item. */
	description?: string
}

/** Properties of a "setParameterValue" action. */
export interface IAppBuilderActionPropsSetParameterValue extends IAppBuilderActionPropsCommon {
	/** The parameter that should be set. */
	parameter: Pick<IAppBuilderParameterRef, "name" | "sessionId">
	/** Value to set. */
	value: string
}

/** 
 * Properties of a "setBrowserLocation" action.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Location
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/open
 */
export interface IAppBuilderActionPropsSetBrowserLocation extends IAppBuilderActionPropsCommon {
	/** 
	 * href to set. 
	 * If this is defined, pathname, search and hash are ignored. 
	 */
	href?: string
	/** 
	 * pathname to set (using the current origin).
	 * If this is defined, search and hash are ignored. 
	 */
	pathname?: string
	/** 
	 * search to set (using the current origin and pathname).
	 * If this is defined, hash is ignored. 
	 */
	search?: string
	/** 
	 * hash to set (using the current origin, pathname and search).
	 */
	hash?: string
	/** 
	 * Optional target. If specified, window.open is used to open the location.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/open
	 */
	target?: "_self" | "_blank" | "_parent" | "_top"
}

/** Properties of a "closeConfigurator" action. */
export type IAppBuilderActionPropsCloseConfigurator = IAppBuilderActionPropsCommon

/** An App Builder action. */
export interface IAppBuilderAction {
	/** Type of the action. */
	type: AppBuilderActionType
	/** Properties of the action. */
	props: IAppBuilderActionPropsCreateModelState
		| IAppBuilderActionPropsAddToCart 
		| IAppBuilderActionPropsSetParameterValue 
		| IAppBuilderActionPropsSetBrowserLocation
		| IAppBuilderActionPropsCloseConfigurator
}

/** Types of widgets */
export type AppBuilderWidgetType = "accordion" 
	| "text" 
	| "image" 
	| "roundChart" 
	| "lineChart" 
	| "areaChart" 
	| "barChart"
	| "actions"
	| "attributeVisualization"
;

/** 
 * Properties of a parameter and export accordion widget.
 * UI elements of the referenced parameters and exports are grouped 
 * and ordered according to their properties (which might be overridden).
 */
export interface IAppBuilderWidgetPropsAccordion {
	/** References to parameters which shall be displayed by the accordion. */
	parameters?: IAppBuilderParameterRef[]
	/** References to exports which shall be displayed by the accordion. */
	exports?: IAppBuilderExportRef[]
	/** 
	 * Optional name of group that should be used for all parameters/exports without a group.
	 * In case this is not specified, parameters/exports without a group will be displayed without an accordion.
	 */
	defaultGroupName?: string
}

/** Properties of a text widget. */
export interface IAppBuilderWidgetPropsText {
	/** Plain text. Takes precedence. */
	text?: string
	/** Optional markdown. */
	markdown?: string
}

export interface IAppBuilderWidgetPropsAnchor {
	/** Follow link. */
	anchor?: string,
	/** Optional reference to specifies where to open the linked document which provides the image, "_blank" by default */
	target?: string,
}

/** Properties of an image widget. */
export interface IAppBuilderWidgetPropsImage extends IAppBuilderWidgetPropsAnchor, IAppBuilderImageRef {
	/** Optional reference to alternate text which provides the image. */
	alt?: string,
}

/** Properties of a widget presenting actions. */
export interface IAppBuilderWidgetPropsActions {
	/** The actions. */
	actions?: IAppBuilderAction[]
}

/** Properties of a widget then attribute visualization. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IAppBuilderWidgetPropsAttributeVisualization {}

/** 
 * A widget.
 * 
 * When implementing a new widget type, extend this interface and 
 * 
 *   * add the identifier for the new type to AppBuilderWidgetType, and
 *   * define a new interface for the properties of the widget type and 
 *     add it to the union type of "props".
 */
export interface IAppBuilderWidget {
	/** Type of the widget. */
	type: AppBuilderWidgetType
	/** Properties of the widget. */
	props: IAppBuilderWidgetPropsAccordion 
		| IAppBuilderWidgetPropsText 
		| IAppBuilderWidgetPropsImage
		| IAppBuilderWidgetPropsRoundChart
		| IAppBuilderWidgetPropsLineChart
		| IAppBuilderWidgetPropsAreaChart
		| IAppBuilderWidgetPropsBarChart
		| IAppBuilderWidgetPropsActions
		| IAppBuilderWidgetPropsAttributeVisualization
}

/** 
 * A tab displayed in a container.
 */
export interface IAppBuilderTab {
	/** Name of the tab. */
	name: string
	/** Optional icon of the tab. */
	icon?: IconType
	/** Optional tooltip. */
	tooltip?: string
	/** Widgets displayed in the tab. */
	widgets: IAppBuilderWidget[]
}

/** Types of hints for containers */
export type AppBuilderContainerNameType = "left" | "right" | "top" | "bottom";

/**
 * A container for UI elements
 */
export interface IAppBuilderContainer {
	/** Name of the container. */
	name: AppBuilderContainerNameType
	/** Tabs displayed in the container. */
	tabs?: IAppBuilderTab[]
	/** Further widgets displayed in the container. */
	widgets?: IAppBuilderWidget[]
}

/**
 * Web app definition. 
 * This is the root of the custom UI definition.
 */
export interface IAppBuilder {

	/** Version of the schema. */
	version: "1.0"

	/** 
	 * Optional list of custom parameters that can be referenced 
	 * in addition to parameters of the model.
	 */
	parameters?: IAppBuilderParameterDefinition[]

	/** Optional id of the session to use for defining custom parameters. */
	sessionId?: string
	
	/**
	 * Containers to be displayed.
	 */
	containers: IAppBuilderContainer[]
}

/** assert widget type "accordion" */
export function isAccordionWidget(widget: IAppBuilderWidget): widget is { type: "accordion", props: IAppBuilderWidgetPropsAccordion } {
	return widget.type === "accordion";
}

/** assert widget type "text" */
export function isTextWidget(widget: IAppBuilderWidget): widget is { type: "text", props: IAppBuilderWidgetPropsText } {
	return widget.type === "text";
}

/** assert widget type "image" */
export function isImageWidget(widget: IAppBuilderWidget): widget is { type: "image", props: IAppBuilderWidgetPropsImage } {
	return widget.type === "image";
}

/** assert widget type "roundChart" */
export function isRoundChartWidget(widget: IAppBuilderWidget): widget is { type: "roundChart", props: IAppBuilderWidgetPropsRoundChart } {
	return widget.type === "roundChart";
}

/** assert widget type "lineChart" */
export function isLineChartWidget(widget: IAppBuilderWidget): widget is { type: "lineChart", props: IAppBuilderWidgetPropsLineChart } {
	return widget.type === "lineChart";
}

/** assert widget type "areaChart" */
export function isAreaChartWidget(widget: IAppBuilderWidget): widget is { type: "areaChart", props: IAppBuilderWidgetPropsAreaChart } {
	return widget.type === "areaChart";
}

/** assert widget type "barChart" */
export function isBarChartWidget(widget: IAppBuilderWidget): widget is { type: "barChart", props: IAppBuilderWidgetPropsBarChart } {
	return widget.type === "barChart";
}

/** assert widget type "actions" */
export function isActionsWidget(widget: IAppBuilderWidget): widget is { type: "actions", props: IAppBuilderWidgetPropsActions } {
	return widget.type === "actions";
}

/** assert widget type "attributeVisualization" */
export function isAttributeVisualizationWidget(widget: IAppBuilderWidget): widget is { type: "attributeVisualization", props: IAppBuilderWidgetPropsAttributeVisualization } {
	return widget.type === "attributeVisualization";
}

/** assert action type "createModelState" */
export function isCreateModelStateAction(action: IAppBuilderAction): action is { type: "createModelState", props: IAppBuilderActionPropsCreateModelState } {
	return action.type === "createModelState";
}

/** assert action type "addToCart" */
export function isAddToCartAction(action: IAppBuilderAction): action is { type: "addToCart", props: IAppBuilderActionPropsAddToCart } {
	return action.type === "addToCart";
}

/** assert action type "setParameterValue" */
export function isSetParameterValueAction(action: IAppBuilderAction): action is { type: "setParameterValue", props: IAppBuilderActionPropsSetParameterValue } {
	return action.type === "setParameterValue";
}

/** assert action type "setBrowserLocation" */
export function isSetBrowserLocationAction(action: IAppBuilderAction): action is { type: "setBrowserLocation", props: IAppBuilderActionPropsSetBrowserLocation } {
	return action.type === "setBrowserLocation";
}

/** assert action type "closeConfigurator" */
export function isCloseConfiguratorAction(action: IAppBuilderAction): action is { type: "closeConfigurator", props: IAppBuilderActionPropsCloseConfigurator } {
	return action.type === "closeConfigurator";
}

/**
 * Settings for a session used by the AppBuilder.
 */
export interface IAppBuilderSettingsSession extends SessionCreateDto {
	/**
	 * Either slug and platformUrl, or ticket and modelViewUrl must be set.
	 */
	slug?: string,
	/**
	 * Either slug and platformUrl, or ticket and modelViewUrl must be set.
	 */
	platformUrl?: string,
	/**
	 * Set to true to require confirmation of the user to accept or reject changed parameter values.
	 */
	acceptRejectMode?: boolean
	/**
	 * Optional model state id.
	 */
	modelStateId?: string
	/**
	 * Optional callback for refreshing the JWT token.
	 */
	refreshJwtToken?: () => Promise<string>
}

/**
 * Settings for a session used by the AppBuilder.
 */
export interface IAppBuilderSettingsJsonSession extends Omit<IAppBuilderSettingsSession, "modelViewUrl"> {
	/**
	 * Override modelViewUrl to be optional.
	 */
	modelViewUrl?: string,
}

/**
 * AppBuilder-related settings.
 */
export interface IAppBuilderSettingsSettings {
	/**
	 * If true, hide the fallback AppBuilder containers which 
	 * are shown in case no AppBuilder data output is found.
	 */
	disableFallbackUi?: boolean,
}

/**
 * Settings for initializing an AppBuilder application from a JSON file. This defines the sessions to create.
 */
export interface IAppBuilderSettingsJson {
	version: "1.0",
	/** Session to load. */
    sessions?: IAppBuilderSettingsJsonSession[]
	/** Settings */
	settings?: IAppBuilderSettingsSettings
	/** 
	 * Theme overrides
	 * @see https://mantine.dev/theming/theme-object/
	 */
	themeOverrides?: Record<string, any>,
	/**
	 * Optional AppBuilder definition, to be used instead of the 
	 * AppBuilder output of the ShapeDiver model. This is useful
	 * for development. 
	 */
	appBuilderOverride?: IAppBuilder
}

/**
 * Settings for initializing an AppBuilder application. This defines the sessions to create.
 */
export interface IAppBuilderSettings extends IAppBuilderSettingsJson {
	/** Session to load. */
    sessions: IAppBuilderSettingsJsonSession[]
}

/**
 * Settings for initializing an AppBuilder application. This defines the sessions to create.
 */
export interface IAppBuilderSettingsResolved extends IAppBuilderSettings {
	/** Session to load. */
    sessions: IAppBuilderSettingsSession[]
}