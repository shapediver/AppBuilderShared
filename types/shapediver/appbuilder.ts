import {IconType} from "@AppBuilderShared/components/ui/Icon";
import {
	IAppBuilderWidgetPropsAreaChart,
	IAppBuilderWidgetPropsBarChart,
	IAppBuilderWidgetPropsLineChart,
	IAppBuilderWidgetPropsRoundChart,
} from "@AppBuilderShared/types/shapediver/appbuildercharts";
import {IShapeDiverExportDefinition} from "@AppBuilderShared/types/shapediver/export";
import {IShapeDiverParameterDefinition} from "@AppBuilderShared/types/shapediver/parameter";
import {SessionCreateDto} from "@AppBuilderShared/types/store/shapediverStoreSession";
import {MantineColor} from "@mantine/core";
import {Gradient} from "@shapediver/viewer.features.attribute-visualization";
import {TAG3D_JUSTIFICATION} from "@shapediver/viewer.session";
import {
	ICameraOptions,
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
} from "@shapediver/viewer.viewport";

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
	value?: string;

	/**
	 * @deprecated use settings.step instead
	 * Optional step value for numeric parameters.
	 */
	step?: number;
};

/** Type used for export definitions */
export type IAppBuilderExportDefinition = IShapeDiverExportDefinition;

/** Types of selection components. */
export type SelectComponentType =
	| "buttonflex"
	| "buttongroup"
	| "chipgroup"
	| "dropdown"
	| "color"
	| "imagedropdown"
	| "fullwidthcards"
	| "carousel"
	| "grid"
	| "multiselect-chips"
	| "multiselect-checkboxes";

/** Data for an item shown by a selection component. */
export interface ISelectComponentItemDataType {
	/** Display name to use instead of the item name. */
	displayname?: string;
	/** Tooltip. */
	tooltip?: string;
	/** Description. */
	description?: string;
	/** URL to image. Can be a data URL including a base 64 encoded image. */
	imageUrl?: string;
	/** Optional color, used for color selection components. */
	color?: MantineColor;
	/** Optionally hide the item. */
	hidden?: boolean;
	/**
	 * Optional additional data that can be sent to a String parameter
	 * represented by a selection component, instead of the selected item value.
	 */
	data?: Record<string, any>;
}

/** Settings for selection parameters (typically used for parameters of type "StringList") */
export interface ISelectParameterSettings {
	/** Type of select component to use. */
	type?: SelectComponentType;
	/** Record containing optional further item data per item name. */
	itemData?: Record<string, ISelectComponentItemDataType>;
	/** Enable search for string list inputs (only for type=="dropdown"). */
	searchable?: boolean;
	/** Max number of options rendered at the same time (only for type=="dropdown"). Default: 5 if searchable is enabled */
	limit?: number;
	/**
	 * Optional CSS controlling the absolute height of the widget.
	 * In case this is not specified, the default behavior of the widget
	 * is to adapt its height according to the items.
	 */
	height?: string;
}

/**
 * Settings for string parameters visualized as selection parameters.
 * In this case, the selected item is set as the string value of the parameter.
 */
export interface IStringParameterSelectSettings
	extends ISelectParameterSettings {
	/**
	 * The items to select from.
	 * In case this is not specified, "source" must be given.
	 */
	items?: string[];
	/**
	 * Name of the "data source" to fetch items and item data from.
	 * This is used for connecting to data sources via the e-commerce API.
	 */
	source?: string;
}

/** Settings for parameters of type "String" */
export interface IStringParameterSettings {
	/** Number of lines to display. If > 1, a Textarea is used with autosize and fixed rows. Default: 1 */
	lines?: number;
	/**
	 * Optional selection settings.
	 * If this is specified, the parameter is visualized as a selection parameter.
	 * In this case, the selected item is set as the string value of the parameter.
	 */
	selectSettings?: IStringParameterSelectSettings;
}

/** Settings for numeric parameters (type "Float", "Int", "Even", "Odd") */
export interface INumberParameterSettings {
	/**
	 * Optional step value for numeric parameters.
	 */
	step?: number;
}

/** Reference to a parameter (custom or defined by the session) */
export interface IAppBuilderParameterRef {
	/** Id or name or displayname of the referenced parameter (in that order). */
	name: string;
	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string;
	/** Properties of the parameter to be overridden. */
	overrides?: Pick<
		Partial<IAppBuilderParameterDefinition>,
		| "displayname"
		| "group"
		| "order"
		| "tooltip"
		| "hidden"
		| "settings"
		| "step"
	>;
	/** Disable the UI element of the parameter if its state is dirty. */
	disableIfDirty?: boolean;
	/** Ask the user to accept or reject changes of this parameter before executing them. */
	acceptRejectMode?: boolean;
}

/** Reference to an export (defined by the session) */
export interface IAppBuilderExportRef {
	/** Id or name or displayname of the referenced export (in that order). */
	name: string;
	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string;
	/** Properties of the export to be overridden. */
	overrides?: Pick<
		Partial<IAppBuilderExportDefinition>,
		"displayname" | "group" | "order" | "tooltip" | "hidden"
	>;
}

/** An App Builder control. */
export interface IAppBuilderControl {
	/** Type of the control. */
	type: AppBuilderControlType;
	/** Properties of the control. */
	props:
		| IAppBuilderControlParameterRef
		| IAppBuilderControlExportRef
		| IAppBuilderControlActionRef
		| IAppBuilderControlOutputRef;
}

/** Types of controls */
export type AppBuilderControlType =
	| "parameter"
	| "export"
	| "action"
	| "output";

/** Control referencing a parameter (custom or defined by the session) */
export interface IAppBuilderControlParameterRef {
	/** Id or name or displayname of the referenced parameter (in that order). */
	name: string;
	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string;
	/** Properties of the parameter to be overridden. */
	overrides?: Pick<
		Partial<IAppBuilderParameterDefinition>,
		"displayname" | "tooltip" | "hidden" | "settings" | "step"
	>;
	/** Disable the UI element of the parameter if its state is dirty. */
	disableIfDirty?: boolean;
	/** Ask the user to accept or reject changes of this parameter before executing them. */
	acceptRejectMode?: boolean;
}

/** Control referencing an export (defined by the session) */
export interface IAppBuilderControlExportRef {
	/** Id or name or displayname of the referenced export (in that order). */
	name: string;
	/** Optional id of the session the referenced export belongs to. */
	sessionId?: string;
	/** Properties of the export to be overridden. */
	overrides?: Pick<
		Partial<IAppBuilderExportDefinition>,
		"displayname" | "tooltip" | "hidden"
	>;
	/**
	 * The parameter values that should be used for the export.
	 * These parameter values must belong to the same session as the export.
	 */
	parameterValues?: IAppBuilderActionPropsSetParameterValue[];
}

/** Control referencing an output (defined by the session) */
export interface IAppBuilderControlOutputRef {
	/** Id or name or displayname of the referenced output (in that order). */
	name: string;
	/** Optional id of the session the referenced output belongs to. */
	sessionId?: string;
	/** Properties of the output to be overridden. */
	overrides?: Pick<
		Partial<IAppBuilderExportDefinition>,
		"displayname" | "tooltip" | "hidden"
	>;
}

/** An App Builder action definition. */
export interface IAppBuilderActionDefinition {
	/** Type of the action. */
	type: AppBuilderActionType;
	/** Properties of the action. */
	props:
		| IAppBuilderActionPropsCreateModelState
		| IAppBuilderActionPropsAddToCart
		| IAppBuilderActionPropsSetParameterValue
		| IAppBuilderActionPropsSetParameterValues
		| IAppBuilderActionPropsSetBrowserLocation
		| IAppBuilderActionPropsCloseConfigurator
		| IAppBuilderActionPropsCamera;
}

/** Common properties of App Builder action controls and legacy actions. */
export interface IAppBuilderActionPropsCommon {
	/** Label (of the button etc). Optional, defaults to a value depending on the type of action. */
	label?: string;
	/** Optional icon (of the button etc). */
	icon?: IconType;
	/** Optional tooltip. */
	tooltip?: string;
}

/** Control referencing an action */
export interface IAppBuilderControlActionRef
	extends IAppBuilderActionPropsCommon {
	/** Embedded action definition. */
	definition: IAppBuilderActionDefinition;
	/** In the future we might include a reference to a globally defined action here.  */
}

/** Reference to an image */
export interface IAppBuilderImageRef {
	/** Optional reference to export which provides the image. */
	export?: Pick<IAppBuilderExportRef, "name" | "sessionId">;
	/** URL to image. Can be a data URL including a base 64 encoded image. Takes precedence over export reference. */
	href?: string;
}

/** Types of parameter value sources */
export type AppBuilderParameterValueSourceType =
	| "screenshot"
	| "dataOutput"
	| "export"
	| "sdtf"
	| "modelState";

/**
 * Properties for the "screenshot" parameter value source.
 * This parameter value source is compatible with parameters of type "File".
 * The specified contentType must be supported by the respective "File"	parameter.
 */
export interface IAppBuilderParameterValueSourcePropsScreenshot {
	/**
	 * Optional type of the screenshot, defaults to "image/png".
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IViewportApi.html#getScreenshot
	 */
	contentType?: string;
	/**
	 * Optional quality of the screenshot, between 0 and 1, defaults to 1.
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IViewportApi.html#getScreenshot
	 */
	quality?: number;
	/**
	 * Optional resolution of the screenshot, defaults to the current resolution of the viewport.
	 * TODO SS-8346 define type
	 */
	resolution?: {width: number; height: number};
	/**
	 * Optional camera settings to be used for the screenshot. Defaults to the current camera of the viewport.
	 * If a "name" is provided, the settings of the camera with that name are used as a base.
	 */
	camera?: OrthographicCameraProperties | PerspectiveCameraProperties;
}

/**
 * Properties for the "dataOutput" parameter value source.
 * This parameter value source is compatible with parameters of type "String" and "File".
 * For "File" parameters, the content type "application/json" is used.
 */
export interface IAppBuilderParameterValueSourcePropsDataOutput {
	/** Id of the session to use for finding the data output. Defaults to the controller session. */
	sessionId?: string;
	/** Id or name or displayname of the referenced data output (in that order). */
	name: string;
}

/**
 * Properties for the "export" parameter value source.
 * This parameter value source is compatible with parameters of type "File".
 * The content type of the exported file must be supported by the "File" parameter.
 */
export interface IAppBuilderParameterValueSourcePropsExport {
	/** Id of the session to use for finding the export. Defaults to the controller session. */
	sessionId?: string;
	/** Id or name or displayname of the referenced export (in that order). */
	name: string;
}

/**
 * Properties for the "sdtf" parameter value source.
 * This parameter value source is compatible with parameters of type "s*".
 *
 * Note: The specified chunk must be compatible with the parameter type,
 * otherwise no data will be set in Grasshopper.
 *
 * @see https://help.shapediver.com/doc/sdtf-structured-data-transfer-format#sdTF-Structureddatatransferformat-Chunkselectionlogic
 */
export interface IAppBuilderParameterValueSourcePropsSdtf {
	/** Id of the session to use for finding the sdtf output. Defaults to the controller session. */
	sessionId?: string;
	/** Id or name or displayname of the referenced sdtf output (in that order). */
	name: string;
	/**
	 * Optional, defines chunk to be used.
	 * @see https://help.shapediver.com/doc/sdtf-structured-data-transfer-format#sdTF-Structureddatatransferformat-Advancedcase
	 */
	chunk?: {
		/** Id of the chunk to be used. */
		id?: string;
		/** Name of the chunk to be used. */
		name?: string;
	};
}

/**
 * Properties for the "modelState" parameter value source.
 * A new model state will be created according to the properties.
 * This parameter value source is compatible with parameters of type "String".
 *
 * The parameter value resulting from this source is the current location (URL),
 * including the following query parameters:
 *   * modelStateId: the id of the created model state
 *   * other query parameters defined in the current URL, except for UTM parameters
 */
export interface IAppBuilderParameterValueSourcePropsModelState
	extends IAppBuilderActionPropsCreateModelState {
	/**
	 * Whether the URL shown in the browser shall be updated
	 * with the newly created modelStateId.
	 */
	updateUrl?: boolean;
}

/** Definition of a parameter value source. */
export interface IAppBuilderParameterValueSourceDefinition {
	/** Type of the parameter value source. */
	type: AppBuilderParameterValueSourceType;
	/** Properties of the parameter value source, depending on type. */
	props:
		| IAppBuilderParameterValueSourcePropsScreenshot
		| IAppBuilderParameterValueSourcePropsDataOutput
		| IAppBuilderParameterValueSourcePropsExport
		| IAppBuilderParameterValueSourcePropsSdtf
		| IAppBuilderParameterValueSourcePropsModelState;
}

/** Types of actions */
export type AppBuilderActionType =
	| "createModelState"
	| "addToCart"
	| "setParameterValue"
	| "setParameterValues"
	| "setBrowserLocation"
	| "closeConfigurator"
	| "camera";

/** Properties of a "createModelState" action. */
export interface IAppBuilderActionPropsCreateModelState {
	/**
	 * Optional flag to control whether an image of the scene shall be
	 * included with the model state.
	 */
	includeImage?: boolean;
	/**
	 * Optional image to be included when creating the model state for the line item.
	 * In case no image is provided here, a screenshot of the model will be used
	 * if @see {@link includeImage} is set to true.
	 */
	image?: IAppBuilderImageRef;
	/**
	 * Optional flag to control whether a glTF export of the scene shall be
	 * included with the model state.
	 */
	includeGltf?: boolean;
	/** Names of parameters to include in the model state. */
	parameterNamesToInclude?: string[];
	/** Names of parameters to exclude from the model state. */
	parameterNamesToExclude?: string[];
}

/** Properties of a legacy "createModelState" action. */
export type IAppBuilderLegacyActionPropsCreateModelState =
	IAppBuilderActionPropsCreateModelState & IAppBuilderActionPropsCommon;

/**
 * Properties of an "addToCart" action.
 * This action triggers a corresponding message to the e-commerce system via the iframe API.
 * A response is awaited and the result is displayed to the user.
 */
export interface IAppBuilderActionPropsAddToCart
	extends IAppBuilderActionPropsCreateModelState {
	/**
	 * Identifier of the product to add to the cart.
	 * Optional, defaults to the product defined by the context.
	 * Note that this productId is not necessarily the same as the id of the product
	 * in the e-commerce system. Translations of product identifiers can be done by
	 * the plug-in embedding App Builder in the respective e-commerce system.
	 */
	productId?: string;
	/** Quantity of the line item to add to the cart (number of units). Optional, defaults to 1. */
	quantity?: number;
	/** Price of the product per unit. */
	price?: number;
	/** Description to be used for the line item. */
	description?: string;
}

/**
 * Properties of a legacy "addToCart" action.
 */
export type IAppBuilderLegacyActionPropsAddToCart =
	IAppBuilderActionPropsAddToCart & IAppBuilderActionPropsCommon;

/**
 * Properties of a "setParameterValue" action.
 * This is a generalized parameter "key, value" pair, given by a
 *   * reference to a parameter, and
 *   * the value to set.
 */
export interface IAppBuilderActionPropsSetParameterValue {
	/** The parameter that should be set. */
	parameter: Pick<IAppBuilderParameterRef, "name" | "sessionId">;
	/** Value to set. Either "value" or "source" must be set. */
	value?: string;
	/** Source of the parameter value. Either "source" or "value" must be set. */
	source?: IAppBuilderParameterValueSourceDefinition;
}

/** Properties of legacy a "setParameterValue" action. */
export type IAppBuilderLegacyActionPropsSetParameterValue =
	IAppBuilderActionPropsSetParameterValue & IAppBuilderActionPropsCommon;

/** Properties of a "setParameterValues" action. */
export interface IAppBuilderActionPropsSetParameterValues {
	/** Parameter values to set. */
	parameterValues: IAppBuilderActionPropsSetParameterValue[];
}

/** Properties of legacy a "setParameterValues" action. */
export type IAppBuilderLegacyActionPropsSetParameterValues =
	IAppBuilderActionPropsSetParameterValues & IAppBuilderActionPropsCommon;

/**
 * Properties of a "setBrowserLocation" action.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Location
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/open
 */
export interface IAppBuilderActionPropsSetBrowserLocation {
	/**
	 * href to set.
	 * If this is defined, pathname, search and hash are ignored.
	 */
	href?: string;
	/**
	 * pathname to set (using the current origin).
	 * If this is defined, search and hash are ignored.
	 */
	pathname?: string;
	/**
	 * search to set (using the current origin and pathname).
	 * If this is defined, hash is ignored.
	 */
	search?: string;
	/**
	 * hash to set (using the current origin, pathname and search).
	 */
	hash?: string;
	/**
	 * Optional target. If specified, window.open is used to open the location.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/open
	 */
	target?: "_self" | "_blank" | "_parent" | "_top";
}

/** Properties of legacy a "setBrowserLocation" action. */
export type IAppBuilderLegacyActionPropsSetBrowserLocation =
	IAppBuilderActionPropsSetBrowserLocation & IAppBuilderActionPropsCommon;

/** Properties of a "closeConfigurator" action. */
export type IAppBuilderActionPropsCloseConfigurator = object;

/** Properties of legacy a "closeConfigurator" action. */
export type IAppBuilderLegacyActionPropsCloseConfigurator =
	IAppBuilderActionPropsCloseConfigurator & IAppBuilderActionPropsCommon;

type IAppBuilderPropsCameraCommon = {
	/** Optional camera settings to be used. Defaults to the initial camera of the viewport. */
	camera?: OrthographicCameraProperties | PerspectiveCameraProperties;
	/** Camera properties, including duration and easing. */
	options?: ICameraOptions;
};

/** Properties of a "animate" action, where the camera is defined by an array of position and targets. */
export type IAppBuilderPropsAnimateCamera = {
	path: {
		/** The position of the camera. */
		position: [number, number, number];
		/** The target the camera is looking at. */
		target: [number, number, number];
	}[];
} & IAppBuilderPropsCameraCommon;

/** Properties of a "set" action, where the camera is defined by position and target. */
export type IAppBuilderPropsSetCamera = {
	/** The position of the camera. */
	position?: [number, number, number];
	/** The target the camera is looking at. */
	target?: [number, number, number];
} & IAppBuilderPropsCameraCommon;

/** Properties of a "reset" action. */
export type IAppBuilderPropsResetCamera = IAppBuilderPropsCameraCommon;

/** Properties of a "zoomTo" action. */
export type IAppBuilderPropsZoomToCamera = IAppBuilderPropsCameraCommon;

/** Properties of a camera action. */
export type IAppBuilderActionPropsCamera = {
	/** Type of camera action. */
	type: "animate" | "set" | "reset" | "zoomTo";
	/** Properties of the camera action. */
	props:
		| IAppBuilderPropsAnimateCamera
		| IAppBuilderPropsSetCamera
		| IAppBuilderPropsResetCamera
		| IAppBuilderPropsZoomToCamera;
} & IAppBuilderActionPropsCommon;

/** A legacy App Builder action definition. */
export interface IAppBuilderLegacyActionDefinition {
	/** Type of the action. */
	type: AppBuilderActionType;
	/** Properties of the action. */
	props:
		| IAppBuilderLegacyActionPropsCreateModelState
		| IAppBuilderLegacyActionPropsAddToCart
		| IAppBuilderLegacyActionPropsSetParameterValue
		| IAppBuilderLegacyActionPropsSetParameterValues
		| IAppBuilderLegacyActionPropsSetBrowserLocation
		| IAppBuilderLegacyActionPropsCloseConfigurator
		| IAppBuilderActionPropsCamera;
}

/** Types of widgets */
export type AppBuilderWidgetType =
	| "accordion"
	| "text"
	| "image"
	| "roundChart"
	| "lineChart"
	| "areaChart"
	| "barChart"
	| "actions"
	| "attributeVisualization"
	| "agent"
	| "progress"
	| "desktopClientSelection"
	| "desktopClientOutputs"
	| "controls"
	| "accordionUi"
	| "sceneTreeExplorer"
	| "stackUi";

/**
 * Properties of a parameter and export accordion widget.
 * UI elements of the referenced parameters and exports are grouped
 * and ordered according to their properties (which might be overridden).
 */
export interface IAppBuilderWidgetPropsAccordion {
	/** References to parameters which shall be displayed by the accordion. */
	parameters?: IAppBuilderParameterRef[];
	/** References to exports which shall be displayed by the accordion. */
	exports?: IAppBuilderExportRef[];
	/**
	 * Optional name of group that should be used for all parameters/exports without a group.
	 * In case this is not specified, parameters/exports without a group will be displayed without an accordion.
	 */
	defaultGroupName?: string;
}

/** Properties of a text widget. */
export interface IAppBuilderWidgetPropsText {
	/** Plain text. Takes precedence. */
	text?: string;
	/** Optional markdown. */
	markdown?: string;
}

export interface IAppBuilderWidgetPropsAnchor {
	/** Follow link. */
	anchor?: string;
	/** Optional reference to specifies where to open the linked document which provides the image, "_blank" by default */
	target?: string;
}

/** Properties of an image widget. */
export interface IAppBuilderWidgetPropsImage
	extends IAppBuilderWidgetPropsAnchor,
		IAppBuilderImageRef {
	/** Optional reference to alternate text which provides the image. */
	alt?: string;
	/**
	 * Optional boolean to indicate that the widget shall render the image as an SVG.
	 * In case this is not specified, the widget will detect whether the image is an
	 * SVG based on its href.
	 */
	isSvg?: boolean;
}

/** Properties of a widget presenting actions. */
export interface IAppBuilderWidgetPropsActions {
	/** The actions. */
	actions?: IAppBuilderLegacyActionDefinition[];
}

/** Properties of a widget presenting controls. */
export interface IAppBuilderWidgetPropsControls {
	/** The controls. */
	controls?: IAppBuilderControl[];
}

/** Enum of the visibility of the attribute visualization. */
export enum AttributeVisualizationVisibility {
	/** The attribute visualization is always enabled. */
	// AlwaysOn = "alwaysOn",
	/** The attribute visualization is enabled by default, but can be turned off. */
	DefaultOn = "defaultOn",
	/** The attribute visualization is disabled by default, but can be turned on. */
	DefaultOff = "defaultOff",
}

/** Properties of a widget then attribute visualization. */
export interface IAppBuilderWidgetPropsAttributeVisualization {
	/** Title for the widget (default: "Attributes") */
	title?: string;
	/** Tooltip for the widget (default: "") */
	tooltip?: string;
	/** List of attributes to be visualized.
	 *  Either a string or an object with the attribute name and an optional gradient.
	 *  If a string is provided, the attribute will be visualized with a default gradient.
	 */
	attributes?: (
		| string
		| {
				attribute: string;
				gradient?: Gradient;
		  }
	)[];
	/** Enable the attribute visualization by default. (default: AttributeVisualizationVisibility.DefaultOff) */
	visualizationMode?: AttributeVisualizationVisibility;
	/** Show the legend, if there is one. (default: true) */
	showLegend?: boolean;
	/** Default gradient, that should be used if none is supplied in the definition of the attribute. (default: TODO) */
	defaultGradient?: Gradient;
	/** Initial attribute that is displayed (default: first attribute in the list) */
	initialAttribute?: string;
	/** Material definition for objects that don't have the selected attribute. (default: { color: "#666666", opacity: 1 }) */
	passiveMaterial?: {
		/** Color of the material. (default: "#666666") */
		color?: string;
		/** Opacity of the material. (default: 1) */
		opacity?: number;
	};
	/** Option to disable the anchors when clicking on an attribute. (default: false) */
	disableAttributeAnchors?: boolean;
}

/** Properties of an AI agent widget. */
export interface IAppBuilderWidgetPropsAgent {
	/** Additional context. */
	context?: string;
	/** Names of parameters to include in agent workflow. */
	parameterNames?: string[];
	/** Names of parameters to exclude in agent workflow. */
	parameterNamesExclude?: string[];
}

/** Properties of a progress widget. */
export interface IAppBuilderWidgetPropsProgress {
	/** Option to show the progress bar when completed. (default: false) */
	showOnComplete?: boolean;
	/** Delay the removal of the last progress details (in milliseconds). (default: 1500) */
	delayRemoval?: number;
	/** Option to show the progress message. (default: false) */
	showMessages?: boolean;
	/** Option to show the progress percentage. (default: true) */
	showPercentage?: boolean;
}

/** Properties of a scene tree explorer widget. */
export interface IAppBuilderWidgetPropsSceneTreeExplorer {
	__placeholder?: never; // This is a placeholder to ensure that this interface is not empty.
}

/** Properties of a desktop client selection widget. */
export interface IAppBuilderWidgetPropsDesktopClientSelection {
	clientsFilter?: string[]; // allowed client names that can be filtered out.
	autoConnect?: boolean; // if true and a single client is detected, it will be automatically connected.
}

/** Properties of a desktop client outputs widget. */
export interface IAppBuilderWidgetPropsDesktopClientOutputs {
	__placeholder?: never; // This is a placeholder to ensure that this interface is not empty.
}

/**
 * Properties of a generic accordion widget, grouping further widgets
 * into an accordion.
 */
export interface IAppBuilderWidgetPropsAccordionUi {
	/** Items of the accordion. */
	items: {
		/**
		 * Optional unique identifier for the accordion item.
		 * Used to identify items when controlling state of the accordion.
		 */
		value?: string;
		/** Label shown for the accordion control of the item. */
		name: string;
		/** Optional icon of the accordion control of the item. */
		icon?: IconType;
		/** Optional tooltip for the accordion control of the item. */
		tooltip?: string;
		/** Widgets displayed in the accordion item. */
		widgets: IAppBuilderWidget[];
	}[];
	/** If set, multiple items can be opened at the same time. */
	multiple?: boolean;
	/**
	 * Optional default state of the accordion items.
	 * Only used for the initial state of the accordion.
	 */
	defaultValue?: string | string[];
	/**
	 * Optional state of the accordion items.
	 * Used to override the current state of the accordion.
	 */
	value?: string | string[];
}

/**
 * Properties of a stack widget, grouping further widgets
 * into a stack.
 */
export interface IAppBuilderWidgetPropsStackUi {
	/** Label shown for the stack control. */
	name: string;
	/** Optional icon of the stack control. */
	icon?: IconType;
	/** Optional tooltip of the stack control. */
	tooltip?: string;
	/** Widgets displayed in the stack. */
	widgets: IAppBuilderWidget[];
}

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
	type: AppBuilderWidgetType;
	/** Properties of the widget. */
	props:
		| IAppBuilderWidgetPropsAccordion
		| IAppBuilderWidgetPropsText
		| IAppBuilderWidgetPropsImage
		| IAppBuilderWidgetPropsRoundChart
		| IAppBuilderWidgetPropsLineChart
		| IAppBuilderWidgetPropsAreaChart
		| IAppBuilderWidgetPropsBarChart
		| IAppBuilderWidgetPropsActions
		| IAppBuilderWidgetPropsAttributeVisualization
		| IAppBuilderWidgetPropsAgent
		| IAppBuilderWidgetPropsProgress
		| IAppBuilderWidgetPropsDesktopClientSelection
		| IAppBuilderWidgetPropsDesktopClientOutputs
		| IAppBuilderWidgetPropsControls
		| IAppBuilderWidgetPropsAccordionUi
		| IAppBuilderWidgetPropsSceneTreeExplorer
		| IAppBuilderWidgetPropsStackUi;
}

/**
 * A tab displayed in a container.
 */
export interface IAppBuilderTab {
	/** Name of the tab. */
	name: string;
	/** Optional icon of the tab. */
	icon?: IconType;
	/** Optional tooltip. */
	tooltip?: string;
	/** Widgets displayed in the tab. */
	widgets: IAppBuilderWidget[];
}

/** Types of hints for containers */
export enum AppBuilderContainerNameType {
	Left = "left",
	Right = "right",
	Top = "top",
	Bottom = "bottom",
	Anchor3d = "anchor3d",
	Anchor2d = "anchor2d",
}

/** Type for the anchor containers */
export type AppBuilderAnchorContainerProperties = {
	/** Id of the container. */
	id: string;
	/** Optional justification of the container. (default: "MC") */
	justification?: TAG3D_JUSTIFICATION;
	/** Optional boolean to allow pointer events on the container. (default: true) */
	allowPointerEvents?: boolean;
	/** Optional icon to be displayed to show the container. */
	previewIcon?: IconType;
	/** Optional width of the container. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1em), % (e.g. 100%) or calc() (e.g. calc(100% - 20px)) */
	width?: string | number;
	/** Optional height of the container. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1em), % (e.g. 100%) or calc() (e.g. calc(100% - 20px)) */
	height?: string | number;
	/** Option to use Paper component (default: true) */
	useContainer?: boolean;
	/** Options for the mobile fallback */
	mobileFallback?: {
		/** if the anchor should be completely disabled */
		disabled?: boolean;
		/**
		 * either a different or a new preview icon to show
		 * if undefined, the original previewIcon logic will be used
		 */
		previewIcon?: IconType;
		/** fallback container to be used ("left", "right", "top", "bottom") */
		container?: AppBuilderContainerNameType;
	};
};

/** Type for the anchor 2d containers */
export type AppBuilderAnchor2dContainerProperties = {
	/** 2D location */
	location: (string | number)[];
	/** Optional boolean to allow dragging of the container. (default: true) */
	draggable?: boolean;
} & AppBuilderAnchorContainerProperties;

/** Type for the anchor 3d containers */
export type AppBuilderAnchor3dContainerProperties = {
	/** 3D location */
	location: number[];
	/** Option to show a close button on the container, if the container is closable (a previewIcon is defined) (default: false) */
	useCloseButton?: boolean;
	/** Option to make the anchor hideable by geometry in the scene (default: false) */
	hideable?: boolean;
} & AppBuilderAnchorContainerProperties;

/**
 * A container for UI elements
 */
export interface IAppBuilderContainer {
	/** Name of the container. */
	name: AppBuilderContainerNameType;
	/** Optional props, depending on the container type */
	props?:
		| AppBuilderAnchor3dContainerProperties
		| AppBuilderAnchor2dContainerProperties;
	/** Tabs displayed in the container. */
	tabs?: IAppBuilderTab[];
	/** Further widgets displayed in the container. */
	widgets?: IAppBuilderWidget[];
}

export type AppBuilderOutputActionsType = "setParameterValue";

export interface IAppBuilderOutputActionsPropsSetParameterValue {
	/** the displayname/name/id of the output */
	output: string;
	/** the displayname/name/id of the parameter that should be set */
	parameter: string;
}

export interface IAppBuilderInstanceDefinition {
	/** Id of the instance. */
	sessionId: string;
	/** Optional name of the instance. This name will be used for the node in the scene graph, e.g. NAME_transformations_0 for the first transformation. */
	name?: string;
	/**
	 * Parameter set for the instance.
	 * Defined in a parameter dictionary where the key is either the displayname, the name or the id of the parameter.
	 * The value is the parameter value.
	 * If none is provided, the default parameter set is used.
	 **/
	parameterValues?: {
		[key: string]:
			| string
			| number
			| boolean
			| IAppBuilderParameterValueSourceDefinition;
	};
	/** Transformations for the instances, e.g. to position them in the scene. */
	transformations?: number[][];
	/** The output actions that should be done after an output has been updated. */
	outputActions?: {
		// the type of action that should be used on the output
		type: AppBuilderOutputActionsType;
		props: IAppBuilderOutputActionsPropsSetParameterValue;
	}[];
}

/**
 * Web app definition.
 * This is the root of the custom UI definition.
 */
export interface IAppBuilder {
	/** Version of the schema. */
	version: "1.0";

	/**
	 * Optional list of custom parameters that can be referenced
	 * in addition to parameters of the model.
	 */
	parameters?: IAppBuilderParameterDefinition[];

	/** Optional id of the session to use for defining custom parameters. */
	sessionId?: string;

	/**
	 * Containers to be displayed.
	 */
	containers: IAppBuilderContainer[];

	/**
	 * Optional list of instances to be created.
	 * Instances are used to customize a session by setting parameters and transformations.
	 */
	instances?: IAppBuilderInstanceDefinition[];
}

/** assert default containers */
export function isStandardContainer(
	container: IAppBuilderContainer,
): container is {
	name:
		| AppBuilderContainerNameType.Left
		| AppBuilderContainerNameType.Right
		| AppBuilderContainerNameType.Top
		| AppBuilderContainerNameType.Bottom;
	props?: undefined;
} {
	return (
		container.name === AppBuilderContainerNameType.Left ||
		container.name === AppBuilderContainerNameType.Right ||
		container.name === AppBuilderContainerNameType.Top ||
		container.name === AppBuilderContainerNameType.Bottom
	);
}

/** assert anchor 2d container */
export function isAnchor2dContainer(
	container: IAppBuilderContainer,
): container is {
	name: AppBuilderContainerNameType.Anchor2d;
	props: AppBuilderAnchor2dContainerProperties;
} {
	return container.name === AppBuilderContainerNameType.Anchor2d;
}

/** assert anchor 3d container */
export function isAnchor3dContainer(
	container: IAppBuilderContainer,
): container is {
	name: AppBuilderContainerNameType.Anchor3d;
	props: AppBuilderAnchor3dContainerProperties;
} {
	return container.name === AppBuilderContainerNameType.Anchor3d;
}

/** assert widget type "accordion" */
export function isAccordionWidget(
	widget: IAppBuilderWidget,
): widget is {type: "accordion"; props: IAppBuilderWidgetPropsAccordion} {
	return widget.type === "accordion";
}

/** assert widget type "text" */
export function isTextWidget(
	widget: IAppBuilderWidget,
): widget is {type: "text"; props: IAppBuilderWidgetPropsText} {
	return widget.type === "text";
}

/** assert widget type "image" */
export function isImageWidget(
	widget: IAppBuilderWidget,
): widget is {type: "image"; props: IAppBuilderWidgetPropsImage} {
	return widget.type === "image";
}

/** assert widget type "roundChart" */
export function isRoundChartWidget(
	widget: IAppBuilderWidget,
): widget is {type: "roundChart"; props: IAppBuilderWidgetPropsRoundChart} {
	return widget.type === "roundChart";
}

/** assert widget type "lineChart" */
export function isLineChartWidget(
	widget: IAppBuilderWidget,
): widget is {type: "lineChart"; props: IAppBuilderWidgetPropsLineChart} {
	return widget.type === "lineChart";
}

/** assert widget type "areaChart" */
export function isAreaChartWidget(
	widget: IAppBuilderWidget,
): widget is {type: "areaChart"; props: IAppBuilderWidgetPropsAreaChart} {
	return widget.type === "areaChart";
}

/** assert widget type "barChart" */
export function isBarChartWidget(
	widget: IAppBuilderWidget,
): widget is {type: "barChart"; props: IAppBuilderWidgetPropsBarChart} {
	return widget.type === "barChart";
}

/** assert widget type "actions" */
export function isActionsWidget(
	widget: IAppBuilderWidget,
): widget is {type: "actions"; props: IAppBuilderWidgetPropsActions} {
	return widget.type === "actions";
}

/** assert widget type "attributeVisualization" */
export function isAttributeVisualizationWidget(
	widget: IAppBuilderWidget,
): widget is {
	type: "attributeVisualization";
	props: IAppBuilderWidgetPropsAttributeVisualization;
} {
	return widget.type === "attributeVisualization";
}

/** assert widget type "agent" */
export function isAgentWidget(
	widget: IAppBuilderWidget,
): widget is {type: "agent"; props: IAppBuilderWidgetPropsAgent} {
	return widget.type === "agent";
}

/** assert widget type "progress" */
export function isProgressWidget(
	widget: IAppBuilderWidget,
): widget is {type: "progress"; props: IAppBuilderWidgetPropsProgress} {
	return widget.type === "progress";
}

/** assert widget type "sceneTreeExplorer" */
export function isSceneTreeExplorerWidget(
	widget: IAppBuilderWidget,
): widget is {
	type: "sceneTreeExplorer";
	props: IAppBuilderWidgetPropsSceneTreeExplorer;
} {
	return widget.type === "sceneTreeExplorer";
}

/** assert widget type "desktopClientSelection" */
export function isDesktopClientSelectionWidget(
	widget: IAppBuilderWidget,
): widget is {
	type: "desktopClientSelection";
	props: IAppBuilderWidgetPropsDesktopClientSelection;
} {
	return widget.type === "desktopClientSelection";
}

/** assert widget type "desktopClientOutputs" */
export function isDesktopClientOutputsWidget(
	widget: IAppBuilderWidget,
): widget is {
	type: "desktopClientOutputs";
	props: IAppBuilderWidgetPropsDesktopClientOutputs;
} {
	return widget.type === "desktopClientOutputs";
}

/** assert widget type "controls" */
export function isControlsWidget(widget: IAppBuilderWidget): widget is {
	type: "controls";
	props: IAppBuilderWidgetPropsControls;
} {
	return widget.type === "controls";
}

/** assert widget type "accordionUi" */
export function isAccordionUiWidget(widget: IAppBuilderWidget): widget is {
	type: "accordionUi";
	props: IAppBuilderWidgetPropsAccordionUi;
} {
	return widget.type === "accordionUi";
}

/** assert widget type "stackUi" */
export function isStackUiWidget(widget: IAppBuilderWidget): widget is {
	type: "stackUi";
	props: IAppBuilderWidgetPropsStackUi;
} {
	return widget.type === "stackUi";
}

/** assert action type "createModelState" */
export function isCreateModelStateAction(
	action: IAppBuilderActionDefinition,
): action is {
	type: "createModelState";
	props: IAppBuilderActionPropsCreateModelState;
} {
	return action.type === "createModelState";
}

/** assert action type "addToCart" */
export function isAddToCartAction(
	action: IAppBuilderActionDefinition,
): action is {type: "addToCart"; props: IAppBuilderActionPropsAddToCart} {
	return action.type === "addToCart";
}

/** assert action type "setParameterValue" */
export function isSetParameterValueAction(
	action: IAppBuilderActionDefinition,
): action is {
	type: "setParameterValue";
	props: IAppBuilderActionPropsSetParameterValue;
} {
	return action.type === "setParameterValue";
}

/** assert action type "setParameterValues" */
export function isSetParameterValuesAction(
	action: IAppBuilderActionDefinition,
): action is {
	type: "setParameterValues";
	props: IAppBuilderActionPropsSetParameterValues;
} {
	return action.type === "setParameterValues";
}

/** assert action type "setBrowserLocation" */
export function isSetBrowserLocationAction(
	action: IAppBuilderActionDefinition,
): action is {
	type: "setBrowserLocation";
	props: IAppBuilderActionPropsSetBrowserLocation;
} {
	return action.type === "setBrowserLocation";
}

/** assert action type "closeConfigurator" */
export function isCloseConfiguratorAction(
	action: IAppBuilderActionDefinition,
): action is {
	type: "closeConfigurator";
	props: IAppBuilderActionPropsCloseConfigurator;
} {
	return action.type === "closeConfigurator";
}

/** assert action type "camera" */
export function isCameraAction(
	action: IAppBuilderActionDefinition,
): action is {type: "camera"; props: IAppBuilderActionPropsCamera} {
	return action.type === "camera";
}

/** assert camera action "animate" */
export function isAnimateCameraAction(
	action: IAppBuilderActionPropsCamera,
): action is {
	type: "animate";
	props: IAppBuilderPropsAnimateCamera;
} {
	return action.type === "animate";
}

/** assert camera action "set" */
export function isSetCameraAction(
	action: IAppBuilderActionPropsCamera,
): action is {
	type: "set";
	props: IAppBuilderPropsSetCamera;
} {
	return action.type === "set";
}

/** assert camera action "reset" */
export function isResetCameraAction(
	action: IAppBuilderActionPropsCamera,
): action is {
	type: "reset";
	props: IAppBuilderPropsResetCamera;
} {
	return action.type === "reset";
}

/** assert camera action "zoomTo" */
export function isZoomToCameraAction(
	action: IAppBuilderActionPropsCamera,
): action is {
	type: "zoomTo";
	props: IAppBuilderPropsZoomToCamera;
} {
	return action.type === "zoomTo";
}

/** assert control type "parameter" */
export function isParameterRefControl(control: IAppBuilderControl): control is {
	type: "parameter";
	props: IAppBuilderControlParameterRef;
} {
	return control.type === "parameter";
}

/** assert control type "export" */
export function isExportRefControl(control: IAppBuilderControl): control is {
	type: "export";
	props: IAppBuilderControlExportRef;
} {
	return control.type === "export";
}

/** assert control type "action" */
export function isActionRefControl(control: IAppBuilderControl): control is {
	type: "action";
	props: IAppBuilderControlActionRef;
} {
	return control.type === "action";
}

/** assert control type "output" */
export function isOutputRefControl(control: IAppBuilderControl): control is {
	type: "output";
	props: IAppBuilderControlOutputRef;
} {
	return control.type === "output";
}

/** assert parameter source */
export function isParameterSource(
	source: IAppBuilderParameterValueSourceDefinition,
): source is IAppBuilderParameterValueSourceDefinition {
	return (
		isDataOutputSource(source) ||
		isExportSource(source) ||
		isSdtfSource(source) ||
		isModelStateSource(source) ||
		isScreenshotSource(source)
	);
}

/** assert source type "dataOutput" */
export function isDataOutputSource(
	source: IAppBuilderParameterValueSourceDefinition,
): source is {
	type: "dataOutput";
	props: IAppBuilderParameterValueSourcePropsDataOutput;
} {
	return source.type === "dataOutput";
}

/** assert source type "export" */
export function isExportSource(
	source: IAppBuilderParameterValueSourceDefinition,
): source is {
	type: "export";
	props: IAppBuilderParameterValueSourcePropsExport;
} {
	return source.type === "export";
}

/** assert source type "sdtf" */
export function isSdtfSource(
	source: IAppBuilderParameterValueSourceDefinition,
): source is {
	type: "sdtf";
	props: IAppBuilderParameterValueSourcePropsSdtf;
} {
	return source.type === "sdtf";
}

/** assert source type "modelState" */
export function isModelStateSource(
	source: IAppBuilderParameterValueSourceDefinition,
): source is {
	type: "modelState";
	props: IAppBuilderParameterValueSourcePropsModelState;
} {
	return source.type === "modelState";
}

/** assert source type "screenshot" */
export function isScreenshotSource(
	source: IAppBuilderParameterValueSourceDefinition,
): source is {
	type: "screenshot";
	props: IAppBuilderParameterValueSourcePropsScreenshot;
} {
	return source.type === "screenshot";
}

/**
 * Settings for a session used by the AppBuilder.
 */
export interface IAppBuilderSettingsSession extends SessionCreateDto {
	/**
	 * Either slug and platformUrl, or ticket and modelViewUrl must be set.
	 */
	slug?: string;
	/**
	 * Either slug and platformUrl, or ticket and modelViewUrl must be set.
	 */
	platformUrl?: string;
	/**
	 * Set to true to require confirmation of the user to accept or reject changed parameter values.
	 */
	acceptRejectMode?: boolean;
	/**
	 * If the attribute visualization should be hidden by default.
	 */
	hideAttributeVisualization?: boolean;
	/**
	 * If the JSON menu should be hidden by default.
	 */
	hideJsonMenu?: boolean;
	/**
	 * If the saved states menu should be hidden by default.
	 */
	hideSavedStates?: boolean;
	/**
	 * If the desktop clients should be hidden by default.
	 */
	hideDesktopClients?: boolean;
	/**
	 * If the exports should be hidden by default.
	 */
	hideExports?: boolean;
	/**
	 * In case we cannot connect to the platform, load settings from the viewer, if they were stored there. (default: undefined)
	 */
	loadPlatformSettingsFromViewer?: "platform" | "iframe";
	/**
	 * Optional model state id.
	 */
	modelStateId?: string;
	/**
	 * Optional callback for refreshing the JWT token.
	 */
	refreshJwtToken?: () => Promise<string>;
	/**
	 * Optional boolean to treat this sessions as an instance (default: false).
	 */
	instance?: boolean;
	/**
	 * If the session is an instance, optional property to delay loading of the instance until the first time it is used. (default: false)
	 */
	loadOnFirstUse?: boolean;
}

/**
 * Settings for a session used by the AppBuilder.
 */
export interface IAppBuilderSettingsJsonSession
	extends Omit<IAppBuilderSettingsSession, "modelViewUrl"> {
	/**
	 * Override modelViewUrl to be optional.
	 */
	modelViewUrl?: string;
}

/**
 * AppBuilder-related settings.
 */
export interface IAppBuilderSettingsSettings {
	/**
	 * If true, hide the fallback AppBuilder containers which
	 * are shown in case no AppBuilder data output is found.
	 */
	disableFallbackUi?: boolean;
}

/**
 * Settings for initializing an AppBuilder application from a JSON file. This defines the sessions to create.
 */
export interface IAppBuilderSettingsJson {
	version: "1.0";
	/** Session to load. */
	sessions?: IAppBuilderSettingsJsonSession[];
	/** Settings */
	settings?: IAppBuilderSettingsSettings;
	/**
	 * Theme overrides
	 * @see https://mantine.dev/theming/theme-object/
	 */
	themeOverrides?: Record<string, any>;
	/**
	 * Optional AppBuilder definition, to be used instead of the
	 * AppBuilder output of the ShapeDiver model. This is useful
	 * for development.
	 */
	appBuilderOverride?: IAppBuilder;
}

/**
 * Settings for initializing an AppBuilder application. This defines the sessions to create.
 */
export interface IAppBuilderSettings extends IAppBuilderSettingsJson {
	/** Session to load. */
	sessions: IAppBuilderSettingsJsonSession[];
}

/**
 * Settings for initializing an AppBuilder application. This defines the sessions to create.
 */
export interface IAppBuilderSettingsResolved extends IAppBuilderSettings {
	/** Session to load. */
	sessions: IAppBuilderSettingsSession[];
}
