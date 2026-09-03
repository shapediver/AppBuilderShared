import {IShapeDiverExportDefinition} from "@AppBuilderLib/entities/export/config/export";
import {ParameterStringInputMode} from "@AppBuilderLib/entities/parameter/config/ParameterStringComponent.theme.types";
import {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {SessionCreateDto} from "@AppBuilderLib/entities/session/config/shapediverStoreSession";
import {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {IAppBuilderWidgetPropsTable} from "@AppBuilderLib/widgets/appbuilder/config/appbuildertable";
import {MantineColor, SliderProps} from "@mantine/core";
import {
	ISelectionParameterProps,
	TAG3D_JUSTIFICATION,
} from "@shapediver/viewer.session";
import {
	Gradient,
	ICameraOptions,
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
} from "@shapediver/viewer.shared.types";
import type {IAppBuilderAgent} from "./appbuilderagent";
import {
	IAppBuilderWidgetPropsAreaChart,
	IAppBuilderWidgetPropsBarChart,
	IAppBuilderWidgetPropsLineChart,
	IAppBuilderWidgetPropsRoundChart,
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
	/** Optional CSS controlling the absolute height of the widget.
	 * In case this is not specified, the default behavior of the widget
	 * is to adapt its height according to the items.
	 */
	height?: string;
	/**
	 * Settings of the optional filterable database to fetch items from.
	 * Currently supported for type "fullwidthcards" and "grid".
	 */
	database?: IFilterableDatabaseSettings;
}

/** Settings of a filterable database component. */
export interface IFilterableDatabaseSettings {
	/**
	 * Source of the data to be displayed in the filterable database component.
	 * This is expected to be a CSV or JSON file, fetched either from a public URL
	 * or from an export defined in a session.
	 * CSV rows are tabular (column index 0, 1, 2, …).
	 * JSON rows are objects: top-level keys match `itemDataDefinition`
	 * (`value`, `displayname`, `imageUrl`, …); custom fields live under `"data"`
	 * (same keys as `itemDataDefinition.data`).
	 * Values of multi-valued columns must be separated by semicolons (or JSON arrays).
	 */
	dataSource: {
		/** Optional reference to export which provides the CSV file. */
		export?: Pick<IAppBuilderExportRef, "name" | "sessionId">;
		/** URL to fetch CSV file from. Takes precedence over export reference. */
		href?: string;
		/** Data file format. Inferred from href suffix when omitted. */
		format?: "csv" | "json";
	};
	/**
	 * Definition of how the itemData shall be extracted from the data source.
	 * Indices are 0-based.
	 */
	itemDataDefinition: {
		/**
		 * Index of the column that holds the value committed to the parameter
		 * (typically column 0). Must match StringList choices or the String value
		 * you intend to store.
		 */
		value: number;
		/** Optional index of the column to use for "displayname". */
		displayname?: number;
		/** Optional index of the column to use for "tooltip". */
		tooltip?: number;
		/** Optional index of the column to use for "description". */
		description?: number;
		/** Optional index of the column to use for "imageUrl". */
		imageUrl?: number;
		/**
		 * Optional index of the column to use for "color".
		 * The color must be given in a format compatible with MantineColor.
		 */
		color?: number;
		/**
		 * Optional record of column indices to use for composing the additional
		 * "data" property, that is sent to the String parameter represented by the
		 * selection component, instead of the selected item value.
		 */
		data?: Record<string, number>;
	};
	/**
	 * Array of filter definitions, defining which filters are shown and how
	 * they are applied to the data source, resulting in updates to the "items"
	 * and "itemData" properties.
	 */
	filters: {
		/** Index of the column to filter. */
		column: number;
		/**
		 * Optional display name for the filter group in the UI (accordion title, active tags).
		 * Defaults to `Filter ${index + 1}` when omitted.
		 */
		label?: string;
		/**
		 * Set this to true if the column contains multiple values separated by semicolons,
		 * and the filter should check if any of the values matches the selected filter value(s).
		 */
		multivalued?: boolean;
		/**
		 * Set this to true if the user should be allowed to pick multiple filter values at
		 * the same time, and the filter should check if any of the values matches any of
		 * the selected filter values.
		 */
		multiple?: boolean;
		/**
		 * Optional type of the filter, defining how the filter values are shown to the user.
		 * `color` — swatch + tag list; `text` — free-text substring match on the column.
		 * Multi-select tag groups (`multiple !== false`, not `text`) show a master "All"
		 * checkbox that selects or clears every option in the group.
		 */
		type?: "color" | "text";
		/**
		 * When `true`, render the filter directly in the dropdown without an accordion
		 * section. Defaults to `false` (accordion Control/Panel). Works for all filter types.
		 */
		inline?: boolean;
		/**
		 * Optional array of filter values to show to the user. If this is not provided, the
		 * filter values are automatically extracted from the data source. Note that this
		 * might have performance implications for large data sources.
		 * For multivalued columns, the filter values are extracted from splitting the column
		 * values by semicolons.
		 */
		filterValues?: string[];
	}[];
}

/**
 * Settings for string parameters visualized as selection parameters.
 * In this case, the selected item is set as the string value of the parameter.
 */
export interface IStringParameterSelectSettings extends ISelectParameterSettings {
	/**
	 * The items to select from.
	 * In case this is not specified, "source" or "database" must be given.
	 */
	items?: string[];
	/**
	 * Name of the optional "data source" to fetch "items" and "itemData" from.
	 * This is used for connecting to data sources via the e-commerce API.
	 * Currently, this is only supported for type "fullwidthcards" and "grid".
	 */
	source?: string;
	/**
	 * Settings of the optional "database" to fetch "items" and "itemData" from.
	 * A filterable database component will be used to show the items and allow
	 * the user to filter them.
	 * Currently, this is only supported for type "fullwidthcards" and "grid".
	 */
	database?: IFilterableDatabaseSettings;
}

/** Settings for parameters of type "String" */
export interface IStringParameterSettings {
	/** Number of lines to display. If > 1, a Textarea is used with autosize and fixed rows. Default: 1 */
	lines?: number;
	/**
	 * Debounce delay in milliseconds before recomputing after text changes.
	 * Same meaning as theme `ParameterStringComponent.defaultProps.debounce`.
	 * Per-parameter override; wins over theme.
	 */
	debounce?: number;
	/**
	 * How the string text input commits values to the session.
	 * Same meaning as theme `ParameterStringComponent.defaultProps.mode`.
	 * Per-parameter override; wins over theme.
	 */
	mode?: ParameterStringInputMode;
	/**
	 * Optional selection settings.
	 * If this is specified, the parameter is visualized as a selection parameter.
	 * In this case, the selected item is set as the string value of the parameter.
	 */
	selectSettings?: IStringParameterSelectSettings;
}

/** Settings for numeric parameters (type "Float", "Int", "Even", "Odd") */
export interface INumberParameterSettings extends Pick<
	SliderProps,
	"marks" | "restrictToMarks" | "step"
> {
	/** Override the minimum value of the slider (can only increase the parameter's min). */
	min?: number;
	/** Override the maximum value of the slider (can only decrease the parameter's max). */
	max?: number;
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
	/** Identifiers of the parameters that shall be updated in addition. */
	delegates: Array<Pick<IAppBuilderParameterRef, "name" | "sessionId">>;
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
export type IAppBuilderActionDefinition =
	| {
			type: AppBuilderActionType.CreateModelState;
			props: IAppBuilderActionPropsCreateModelState;
	  }
	| {
			type: AppBuilderActionType.AddToCart;
			props: IAppBuilderActionPropsAddToCart;
	  }
	| {
			type: AppBuilderActionType.SetParameterValue;
			props: IAppBuilderActionPropsSetParameterValue;
	  }
	| {
			type: AppBuilderActionType.SetParameterValues;
			props: IAppBuilderActionPropsSetParameterValues;
	  }
	| {
			type: AppBuilderActionType.SetBrowserLocation;
			props: IAppBuilderActionPropsSetBrowserLocation;
	  }
	| {
			type: AppBuilderActionType.CloseConfigurator;
			props: IAppBuilderActionPropsCloseConfigurator;
	  }
	| {type: AppBuilderActionType.Ar; props: IAppBuilderActionPropsAr}
	| {
			type: AppBuilderActionType.Fullscreen;
			props: IAppBuilderActionPropsFullscreen;
	  }
	| {type: AppBuilderActionType.Undo; props: IAppBuilderActionPropsUndo}
	| {type: AppBuilderActionType.Redo; props: IAppBuilderActionPropsRedo}
	| {
			type: AppBuilderActionType.ResetParameterValues;
			props: IAppBuilderActionPropsResetParameterValues;
	  }
	| {
			type: AppBuilderActionType.ImportParameterValues;
			props: IAppBuilderActionPropsImportParameterValues;
	  }
	| {
			type: AppBuilderActionType.ExportParameterValues;
			props: IAppBuilderActionPropsExportParameterValues;
	  }
	| {
			type: AppBuilderActionType.ImportModelState;
			props: IAppBuilderActionPropsImportModelState;
	  }
	| {type: AppBuilderActionType.Camera; props: IAppBuilderActionPropsCamera}
	| {type: AppBuilderActionType.Sound; props: IAppBuilderActionPropsSound}
	| {
			type: AppBuilderActionType.MessageToParent;
			props: IAppBuilderActionPropsMessageToParent;
	  }
	| {
			type: AppBuilderActionType.SetContainerVisibility;
			props: IAppBuilderActionPropsSetContainerVisibility;
	  };

/** Common properties of App Builder action controls and legacy actions. */
export interface IAppBuilderActionPropsCommon {
	/** Optional identifier of the action. Used to uniquely reference actions in agent definitions, etc. */
	id?: string;
	/** Label (of the button etc). Optional, defaults to a value depending on the type of action. Set to empty string to show only an icon. */
	label?: string;
	/** Optional icon (of the button etc). */
	icon?: IconType;
	/** Optional tooltip. */
	tooltip?: string;
}

/** Control referencing an action */
export interface IAppBuilderControlActionRef extends IAppBuilderActionPropsCommon {
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
	| "modelState"
	| "agentTool";

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
	camera?:
		| Partial<OrthographicCameraProperties>
		| Partial<PerspectiveCameraProperties>;
}

export interface IAppBuilderParameterValueSourcePropsCommon {
	/** Id of the session to use for finding the parameter value source. Defaults to the controller session. */
	sessionId?: string;
	/** Id or name or displayname of the referenced parameter value source (in that order). */
	name: string;
}

/**
 * Properties for the "dataOutput" parameter value source.
 * This parameter value source is compatible with parameters of type "String" and "File".
 * For "File" parameters, the content type "application/json" is used.
 */
export type IAppBuilderParameterValueSourcePropsDataOutput =
	IAppBuilderParameterValueSourcePropsCommon;

/**
 * Properties for the "export" parameter value source.
 * This parameter value source is compatible with parameters of type "File".
 * The content type of the exported file must be supported by the "File" parameter.
 */
export interface IAppBuilderParameterValueSourcePropsExport extends IAppBuilderParameterValueSourcePropsCommon {
	/**
	 * Parameter set tha is used in the session to get the parameter value source.
	 * Defined in a parameter dictionary where the key is either the displayname, the name or the id of the parameter.
	 * The value is the parameter value.
	 * If none is provided, the default parameter set is used.
	 **/
	parameterValues?: {
		[key: string]: IAppBuilderParameterValueDefinition;
	};
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
export interface IAppBuilderParameterValueSourcePropsSdtf extends IAppBuilderParameterValueSourcePropsCommon {
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
export interface IAppBuilderParameterValueSourcePropsModelState extends IAppBuilderActionPropsCreateModelState {
	/**
	 * Whether the URL shown in the browser shall be updated
	 * with the newly created modelStateId.
	 */
	updateUrl?: boolean;
}

/**
 * Properties for the "agentTool" parameter value source.
 * This source is used for actions that are triggered by an agent tool.
 */
export interface IAppBuilderParameterValueSourcePropsAgentTool {
	/**
	 * JSON path to the value in the agent tool's input data that should be used as the parameter value.
	 * @see https://www.rfc-editor.org/info/rfc9535/
	 */
	jsonPath: string;
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
		| IAppBuilderParameterValueSourcePropsModelState
		| IAppBuilderParameterValueSourcePropsAgentTool;
}

/** Type used for parameter value definitions */
export type IAppBuilderParameterValueDefinition =
	| string
	| number
	| boolean
	| IAppBuilderParameterValueSourceDefinition;

/** Types of actions */
export enum AppBuilderActionType {
	CreateModelState = "createModelState",
	AddToCart = "addToCart",
	SetParameterValue = "setParameterValue",
	SetParameterValues = "setParameterValues",
	SetBrowserLocation = "setBrowserLocation",
	CloseConfigurator = "closeConfigurator",
	Ar = "ar",
	Fullscreen = "fullscreen",
	Undo = "undo",
	Redo = "redo",
	ResetParameterValues = "resetParameterValues",
	ImportParameterValues = "importParameterValues",
	ExportParameterValues = "exportParameterValues",
	ImportModelState = "importModelState",
	Camera = "camera",
	Sound = "sound",
	MessageToParent = "messageToParent",
	SetContainerVisibility = "setContainerVisibility",
}

/** Properties of a "setContainerVisibility" action. */
export interface IAppBuilderActionPropsSetContainerVisibility {
	/** Container to open or close. */
	container: Pick<IAppBuilderContainer, "name"> & {
		props?: Pick<NonNullable<IAppBuilderContainer["props"]>, "id">;
	};
	/** Mode of the action. */
	mode: "open" | "close" | "toggle";
}

/**
 * Properties of a "createModelState" action (also inherited by "addToCart").
 *
 * @docAttached
 * @category feature
 * @configPath actions.createModelState.props
 * @displayName IAppBuilderActionPropsCreateModelState
 */
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
	/**
	 * Optional screenshot settings applied when capturing the preview image
	 * automatically (i.e. when {@link includeImage} is true and no explicit
	 * {@link image} is provided).
	 */
	screenshotProps?: IAppBuilderParameterValueSourcePropsScreenshot;
	/**
	 * Optional success message shown after a model state has been created.
	 * Supports the optional placeholder `{modelStateId}`.
	 */
	successMessage?: string;
	/**
	 * Optional error message shown when creating a model state fails.
	 * Supports the optional placeholder `{modelStateId}` when available.
	 */
	errorMessage?: string;
}

/** Properties of a legacy "createModelState" action. */
export type IAppBuilderLegacyActionPropsCreateModelState =
	IAppBuilderActionPropsCreateModelState & IAppBuilderActionPropsCommon;

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
	productId?: string;
	/** Quantity of the line item to add to the cart (number of units). Optional, defaults to 1. */
	quantity?: number;
	/** Price of the product per unit. */
	price?: number;
	/** Description to be used for the line item. */
	description?: string;
	/**
	 * Optional title to be used for overriding the product's default title
	 * for the added line item.
	 */
	title?: string;
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
	/** Optional user-facing message when the action runs. */
	message?: string;
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

/** Properties of an "ar" action. */
export interface IAppBuilderActionPropsAr {
	/** Optional viewport id. Defaults to the containing viewport. */
	viewportId?: string;
}

/** Properties of legacy an "ar" action. */
export type IAppBuilderLegacyActionPropsAr = IAppBuilderActionPropsAr &
	IAppBuilderActionPropsCommon;

/** Properties of a "fullscreen" action. */
export interface IAppBuilderActionPropsFullscreen {
	/** Fullscreen mode. */
	type?: "fullscreen" | "fullscreen3States";
	/** Optional fullscreen element id. */
	fullscreenId?: string;
}

/** Properties of legacy a "fullscreen" action. */
export type IAppBuilderLegacyActionPropsFullscreen =
	IAppBuilderActionPropsFullscreen & IAppBuilderActionPropsCommon;

/** Properties of an "undo" action. */
export type IAppBuilderActionPropsUndo = object;

/** Properties of a "redo" action. */
export type IAppBuilderActionPropsRedo = object;

/** Properties of legacy an "undo" action. */
export type IAppBuilderLegacyActionPropsUndo = IAppBuilderActionPropsUndo &
	IAppBuilderActionPropsCommon;

/** Properties of legacy a "redo" action. */
export type IAppBuilderLegacyActionPropsRedo = IAppBuilderActionPropsRedo &
	IAppBuilderActionPropsCommon;

/** Properties of a "resetParameterValues" action. */
export type IAppBuilderActionPropsResetParameterValues = object;

/** Properties of legacy a "resetParameterValues" action. */
export type IAppBuilderLegacyActionPropsResetParameterValues =
	IAppBuilderActionPropsResetParameterValues & IAppBuilderActionPropsCommon;

/** Properties of an "importParameterValues" action. */
export type IAppBuilderActionPropsImportParameterValues = object;

/** Properties of legacy an "importParameterValues" action. */
export type IAppBuilderLegacyActionPropsImportParameterValues =
	IAppBuilderActionPropsImportParameterValues & IAppBuilderActionPropsCommon;

/** Properties of an "exportParameterValues" action. */
export type IAppBuilderActionPropsExportParameterValues = object;

/** Properties of legacy an "exportParameterValues" action. */
export type IAppBuilderLegacyActionPropsExportParameterValues =
	IAppBuilderActionPropsExportParameterValues & IAppBuilderActionPropsCommon;

/** Properties of an "importModelState" action. */
export type IAppBuilderActionPropsImportModelState = object;

/** Properties of legacy an "importModelState" action. */
export type IAppBuilderLegacyActionPropsImportModelState =
	IAppBuilderActionPropsImportModelState & IAppBuilderActionPropsCommon;

type IAppBuilderPropsCameraCommon = {
	/** Optional camera settings to be used. Defaults to the initial camera of the viewport. */
	camera?:
		| Partial<OrthographicCameraProperties>
		| Partial<PerspectiveCameraProperties>;
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
	/** Whether to start the animation from the current camera position and target. (default: true) */
	startFromCurrent?: boolean;
} & IAppBuilderPropsCameraCommon;

/** Properties of an "assign" action, where the camera is defined by its properties. */
export type IAppBuilderPropsAssignCamera = IAppBuilderPropsCameraCommon;

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
export type IAppBuilderPropsZoomToCamera = {
	/** The initial position from which to start the zoom. */
	initialPosition?: [number, number, number];
	/** The initial target from which to start the zoom. */
	initialTarget?: [number, number, number];
	/** Optional name filter to restrict the zoom to specific nodes. */
	nameFilter?: string[];
} & IAppBuilderPropsCameraCommon;

/** Properties of a camera action. */
export type IAppBuilderActionPropsCamera = {
	/** Type of camera action. */
	type: "animate" | "assign" | "set" | "reset" | "zoomTo";
	/** Optional viewport id. Defaults to the containing viewport. */
	viewportId?: string;
	/** Properties of the camera action. */
	props:
		| IAppBuilderPropsAnimateCamera
		| IAppBuilderPropsAssignCamera
		| IAppBuilderPropsSetCamera
		| IAppBuilderPropsResetCamera
		| IAppBuilderPropsZoomToCamera;
} & IAppBuilderActionPropsCommon;

export type IAppBuilderLegacyActionPropsCamera = IAppBuilderActionPropsCamera &
	IAppBuilderActionPropsCommon;

/** Properties of a "sound" action. */
export type IAppBuilderActionPropsSound = {
	/** URL of the sound file to play */
	href: string;
	/**
	 * Start playing the sound as soon as a control embedding the action gets rendered.
	 * Note: The browser may block this.
	 */
	autoplay?: boolean;
	/** Loop the audio file. */
	loop?: boolean;
	/** Label to show when the sound is playing. */
	labelPlaying?: string;
	/** Icon to show when the sound is playing. */
	iconPlaying?: IconType;
};

/** Properties of a legacy "sound" action. */
export type IAppBuilderLegacyActionPropsSound = IAppBuilderActionPropsSound &
	IAppBuilderActionPropsCommon;

/** Properties of a legacy "setContainerVisibility" action. */
export type IAppBuilderLegacyActionPropsSetContainerVisibility =
	IAppBuilderActionPropsSetContainerVisibility & IAppBuilderActionPropsCommon;

/** Properties of a "messageToParent" action. */
export interface IAppBuilderActionPropsMessageToParent {
	/** Type identifier for the message. */
	type: string;
	/** Optional message data. */
	data?: Record<string, unknown>;
}

/** Properties of legacy a "messageToParent" action. */
export type IAppBuilderLegacyActionPropsMessageToParent =
	IAppBuilderActionPropsMessageToParent & IAppBuilderActionPropsCommon;

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
		| IAppBuilderLegacyActionPropsAr
		| IAppBuilderLegacyActionPropsFullscreen
		| IAppBuilderLegacyActionPropsUndo
		| IAppBuilderLegacyActionPropsRedo
		| IAppBuilderLegacyActionPropsResetParameterValues
		| IAppBuilderLegacyActionPropsImportParameterValues
		| IAppBuilderLegacyActionPropsExportParameterValues
		| IAppBuilderLegacyActionPropsImportModelState
		| IAppBuilderLegacyActionPropsCamera
		| IAppBuilderLegacyActionPropsSound
		| IAppBuilderLegacyActionPropsSetContainerVisibility
		| IAppBuilderLegacyActionPropsMessageToParent;
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
	| "form"
	| "accordionUi"
	| "savedStates"
	| "sceneTreeExplorer"
	| "stackUi"
	| "table";

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
	extends IAppBuilderWidgetPropsAnchor, IAppBuilderImageRef {
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

/** Submit behavior for form widget */
export enum FormWidgetSubmitBehavior {
	NONE = "none",
	RESET = "reset",
	MESSAGE = "message",
}

/** Properties of a form widget. */
export interface IAppBuilderWidgetPropsForm {
	/** The controls to display in the form. */
	controls?: IAppBuilderControl[];
	/** References to parameters which shall be displayed by the form. */
	parameters?: IAppBuilderParameterRef[];
	/** Export to trigger on form submission (supports export-control fields such as parameterValues). */
	export?: IAppBuilderControlExportRef;
	/** What to do after successful form submission. */
	submit?: FormWidgetSubmitBehavior;
	/** Success message to display (when submit is "message"). */
	successMessage?: string;
	/** Error message to display (when submit is "message"). */
	errorMessage?: string;
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

export type SavedStatesVisualization = Extract<
	SelectComponentType,
	| "buttonflex"
	| "buttongroup"
	| "chipgroup"
	| "dropdown"
	| "imagedropdown"
	| "fullwidthcards"
	| "carousel"
	| "grid"
>;

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
		/** Color of the material. (default: "#000") */
		color?: string;
		/** Opacity of the material. (default: 0.1) */
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

/** Properties of a saved states widget. */
export interface IAppBuilderWidgetPropsSavedStates {
	visualization?: SavedStatesVisualization;
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
		| IAppBuilderWidgetPropsForm
		| IAppBuilderWidgetPropsAccordionUi
		| IAppBuilderWidgetPropsSavedStates
		| IAppBuilderWidgetPropsSceneTreeExplorer
		| IAppBuilderWidgetPropsStackUi
		| IAppBuilderWidgetPropsTable;
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
	Toolbar = "toolbar",
}

export type AppBuilderToolbarSide = "top" | "bottom" | "left" | "right";

export type AppBuilderToolbarAlign = "start" | "center" | "end";

export type AppBuilderToolbarVisibility = "always" | "onMouseActivity";

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
	/** Option to show a close button on the container, if the container is closable (a previewIcon is defined) (default: false) */
	useCloseButton?: boolean;
	/** Optional width of the container. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1em), % (e.g. 100%) or calc() (e.g. calc(100% - 20px)) */
	width?: string | number;
	/** Optional height of the container. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1em), % (e.g. 100%) or calc() (e.g. calc(100% - 20px)) */
	height?: string | number;
	/** Optional maxWidth of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) */
	maxWidth?: string | number;
	/** Optional maxHeight of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) */
	maxHeight?: string | number;
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
	/** Optional selection options. These options replace the behavior of the previewIcon and show the corresponding Anchor when the selection is active. (default: undefined) */
	selectionProperties?: Omit<
		ISelectionParameterProps,
		"minimumSelection" | "maximumSelection" | "deselectOnEmpty" | "prompt"
	>;
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
	/** Option to make the anchor hideable by geometry in the scene (default: false) */
	hideable?: boolean;
} & AppBuilderAnchorContainerProperties;

export type AppBuilderToolbarItemType =
	| AppBuilderControlType
	| "actionMenu"
	| "widgets"
	| "tabs";

export interface IAppBuilderToolbarItemBase<
	TType extends AppBuilderToolbarItemType,
	TProps extends object,
> {
	/** Discriminator for toolbar item rendering and validation. */
	type: TType;
	/** Item-specific payload. */
	props: TProps;
	/** Optional stable id for runtime APIs, accessibility and diagnostics. */
	id?: string;
	/** Toolbar-specific presentation override. */
	icon?: IconType;
	label?: string;
	tooltip?: string;
	/** Optional item order for runtime-merged groups. */
	order?: number;
	/** Optional presentation mode when this item is rendered inside a popover. */
	presentation?: "button" | "item";
}

export type IAppBuilderToolbarParameterItem = IAppBuilderToolbarItemBase<
	"parameter",
	IAppBuilderControlParameterRef
>;

export type IAppBuilderToolbarExportItem = IAppBuilderToolbarItemBase<
	"export",
	IAppBuilderControlExportRef
>;

export type IAppBuilderToolbarOutputItem = IAppBuilderToolbarItemBase<
	"output",
	IAppBuilderControlOutputRef
>;

export type IAppBuilderToolbarActionItem = IAppBuilderToolbarItemBase<
	"action",
	IAppBuilderControlActionRef
>;

export type IAppBuilderToolbarControlItem =
	| IAppBuilderToolbarParameterItem
	| IAppBuilderToolbarExportItem
	| IAppBuilderToolbarOutputItem
	| IAppBuilderToolbarActionItem;

export type IAppBuilderToolbarActionMenuItem = IAppBuilderToolbarItemBase<
	"actionMenu",
	{
		/** Action sections rendered when this item is opened. */
		sections: IAppBuilderToolbarActionItem[][];
	}
>;

export type IAppBuilderToolbarWidgetPanelItem = IAppBuilderToolbarItemBase<
	"widgets",
	{
		/** Widgets rendered when this item is opened. */
		widgets: IAppBuilderWidget[];
	}
>;

export type IAppBuilderToolbarTabbedPanelItem = IAppBuilderToolbarItemBase<
	"tabs",
	{
		/** Tabs rendered when this item is opened. */
		tabs: IAppBuilderTab[];
		/** When true, tabs stick to the top when scrolling the opened item content. */
		stickyTabs?: boolean;
	}
>;

export type IAppBuilderToolbarItem =
	| IAppBuilderToolbarControlItem
	| IAppBuilderToolbarActionMenuItem
	| IAppBuilderToolbarWidgetPanelItem
	| IAppBuilderToolbarTabbedPanelItem;

export type IAppBuilderToolbarGroups = IAppBuilderToolbarItem[][];

export interface IAppBuilderToolbarContainerProperties {
	/** Stable id used by runtime APIs and accessibility. */
	id: string;
	/** Screen edge. */
	side?: AppBuilderToolbarSide;
	/** Alignment along the selected edge. */
	align?: AppBuilderToolbarAlign;
	/** Lower values render first / closer to the edge. */
	order?: number;
	/** Visibility behavior. */
	visibility?: AppBuilderToolbarVisibility;
}

export interface IAppBuilderStandardContainer {
	/** Name of the container. */
	name:
		| AppBuilderContainerNameType.Left
		| AppBuilderContainerNameType.Right
		| AppBuilderContainerNameType.Top
		| AppBuilderContainerNameType.Bottom;
	/** Standard containers do not use custom props. */
	props?: undefined;
	/** Tabs displayed in the container. */
	tabs?: IAppBuilderTab[];
	/** When true, tabs stick to the top when scrolling the container content. */
	stickyTabs?: boolean;
	/** Further widgets displayed in the container. */
	widgets?: IAppBuilderWidget[];
}

export interface IAppBuilderAnchor2dContainer {
	/** Name of the container. */
	name: AppBuilderContainerNameType.Anchor2d;
	/** Anchor-specific props. */
	props: AppBuilderAnchor2dContainerProperties;
	/** Tabs displayed in the container. */
	tabs?: IAppBuilderTab[];
	/** When true, tabs stick to the top when scrolling the container content. */
	stickyTabs?: boolean;
	/** Further widgets displayed in the container. */
	widgets?: IAppBuilderWidget[];
}

export interface IAppBuilderAnchor3dContainer {
	/** Name of the container. */
	name: AppBuilderContainerNameType.Anchor3d;
	/** Anchor-specific props. */
	props: AppBuilderAnchor3dContainerProperties;
	/** Tabs displayed in the container. */
	tabs?: IAppBuilderTab[];
	/** When true, tabs stick to the top when scrolling the container content. */
	stickyTabs?: boolean;
	/** Further widgets displayed in the container. */
	widgets?: IAppBuilderWidget[];
}

export interface IAppBuilderToolbarContainer {
	/** Name of the container. */
	name: AppBuilderContainerNameType.Toolbar;
	/** Toolbar-specific props. */
	props: IAppBuilderToolbarContainerProperties;
	/** Branch/group-preserving toolbar content. Outer array = groups, inner array = items within a group. */
	groups?: IAppBuilderToolbarGroups;
}

/**
 * A container for UI elements.
 *
 * The container type is discriminated by `name`, while the specific fields are
 * split per container kind.
 */
export type IAppBuilderContainer =
	| IAppBuilderStandardContainer
	| IAppBuilderAnchor2dContainer
	| IAppBuilderAnchor3dContainer
	| IAppBuilderToolbarContainer;

/** Types of actions to be executed after updating outputs. */
export type AppBuilderOutputActionsType = "setParameterValue";

/**
 * Properties of a "setParameterValue" output action.
 *
 * The returned parameter value is returned in the following format:
 * {
 *   [instanceId: string]: {
 *     [output: string]: ResOutputContent[] | undefined
 *   }
 * }
 * where the key `instanceId` is the name of the instance (if provided) or the identifier `instance[i]`
 * with i being the index of the instance in the instances array.
 *
 * The key `output` is the displayname/name/id of the output specified in the output action.
 *
 * The value is the array of ResOutputContent returned by the output.
 */
export interface IAppBuilderOutputActionsPropsSetParameterValue {
	/** The displayname/name/id of the output to check for updates. */
	output: string;
	/** The displayname/name/id of the parameter that should be set based on the value of the output. */
	parameter: string;
}

export interface IAppBuilderInstanceDefinition {
	/** Id of the instance. */
	sessionId: string;
	/** Optional slug of the instance. If a slug is provided, the instance will be loaded immediately with that slug. */
	slug?: string;
	/** Optional name of the instance. This name will be used for the node in the scene graph, e.g. NAME_transformations_0 for the first transformation. */
	name?: string;
	/**
	 * Parameter set for the instance.
	 * Defined in a parameter dictionary where the key is either the displayname, the name or the id of the parameter.
	 * The value is the parameter value.
	 * If none is provided, the default parameter set is used.
	 **/
	parameterValues?: {
		[key: string]: IAppBuilderParameterValueDefinition;
	};
	/** Transformations for the instances, e.g. to position them in the scene. */
	transformations?: number[][];
	/** The actions that should be executed after an output of the instance has been updated. */
	outputActions?: {
		/** The type of output action that should be used. */
		type: AppBuilderOutputActionsType;
		/** Properties of the output action. */
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

	/**
	 * Optional list of agents.
	 * For now only one agent is supported, but in the future we might support
	 * multiple agents, or allow agents to reference others as sub-agents.
	 * We do not consider parametric updates to the agent definition, i.e.,
	 * the agents get initialized on loading of the app, and updates to this
	 * property due to parameter changes are ignored.
	 */
	agents?: IAppBuilderAgent[];
}

/** assert default containers */
export function isStandardContainer(
	container: IAppBuilderContainer,
): container is IAppBuilderStandardContainer {
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
): container is IAppBuilderAnchor2dContainer {
	return container.name === AppBuilderContainerNameType.Anchor2d;
}

/** assert anchor 3d container */
export function isAnchor3dContainer(
	container: IAppBuilderContainer,
): container is IAppBuilderAnchor3dContainer {
	return container.name === AppBuilderContainerNameType.Anchor3d;
}

/** assert toolbar container */
export function isToolbarContainer(
	container: IAppBuilderContainer,
): container is IAppBuilderToolbarContainer {
	return container.name === AppBuilderContainerNameType.Toolbar;
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

/** assert widget type "form" */
export function isFormWidget(widget: IAppBuilderWidget): widget is {
	type: "form";
	props: IAppBuilderWidgetPropsForm;
} {
	return widget.type === "form";
}

/** assert widget type "accordionUi" */
export function isAccordionUiWidget(widget: IAppBuilderWidget): widget is {
	type: "accordionUi";
	props: IAppBuilderWidgetPropsAccordionUi;
} {
	return widget.type === "accordionUi";
}

/** assert widget type "savedStates" */
export function isSavedStatesWidget(widget: IAppBuilderWidget): widget is {
	type: "savedStates";
	props: IAppBuilderWidgetPropsSavedStates;
} {
	return widget.type === "savedStates";
}

/** assert widget type "stackUi" */
export function isStackUiWidget(widget: IAppBuilderWidget): widget is {
	type: "stackUi";
	props: IAppBuilderWidgetPropsStackUi;
} {
	return widget.type === "stackUi";
}

/** assert widget type "table" */
export function isTableWidget(widget: IAppBuilderWidget): widget is {
	type: "table";
	props: IAppBuilderWidgetPropsTable;
} {
	return widget.type === "table";
}

function isActionType<T extends AppBuilderActionType>(
	action: IAppBuilderActionDefinition,
	type: T,
): action is Extract<IAppBuilderActionDefinition, {type: T}> {
	return action.type === type;
}

/** assert action type "createModelState" */
export function isCreateModelStateAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.CreateModelState}
> {
	return isActionType(action, AppBuilderActionType.CreateModelState);
}

/** assert action type "addToCart" */
export function isAddToCartAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.AddToCart}
> {
	return isActionType(action, AppBuilderActionType.AddToCart);
}

/** assert action type "setParameterValue" */
export function isSetParameterValueAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.SetParameterValue}
> {
	return isActionType(action, AppBuilderActionType.SetParameterValue);
}

/** assert action type "setParameterValues" */
export function isSetParameterValuesAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.SetParameterValues}
> {
	return isActionType(action, AppBuilderActionType.SetParameterValues);
}

/** assert action type "setBrowserLocation" */
export function isSetBrowserLocationAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.SetBrowserLocation}
> {
	return isActionType(action, AppBuilderActionType.SetBrowserLocation);
}

/** assert action type "closeConfigurator" */
export function isCloseConfiguratorAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.CloseConfigurator}
> {
	return isActionType(action, AppBuilderActionType.CloseConfigurator);
}

/** assert action type "ar" */
export function isArAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.Ar}
> {
	return isActionType(action, AppBuilderActionType.Ar);
}

/** assert action type "fullscreen" */
export function isFullscreenAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.Fullscreen}
> {
	return isActionType(action, AppBuilderActionType.Fullscreen);
}

/** assert action type "undo" */
export function isUndoAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.Undo}
> {
	return isActionType(action, AppBuilderActionType.Undo);
}

/** assert action type "redo" */
export function isRedoAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.Redo}
> {
	return isActionType(action, AppBuilderActionType.Redo);
}

/** assert action type "resetParameterValues" */
export function isResetParameterValuesAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.ResetParameterValues}
> {
	return isActionType(action, AppBuilderActionType.ResetParameterValues);
}

/** assert action type "importParameterValues" */
export function isImportParameterValuesAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.ImportParameterValues}
> {
	return isActionType(action, AppBuilderActionType.ImportParameterValues);
}

/** assert action type "exportParameterValues" */
export function isExportParameterValuesAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.ExportParameterValues}
> {
	return isActionType(action, AppBuilderActionType.ExportParameterValues);
}

/** assert action type "importModelState" */
export function isImportModelStateAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.ImportModelState}
> {
	return isActionType(action, AppBuilderActionType.ImportModelState);
}

/** assert action type "camera" */
export function isCameraAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.Camera}
> {
	return isActionType(action, AppBuilderActionType.Camera);
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

/** assert camera action "assign" */
export function isAssignCameraAction(
	action: IAppBuilderActionPropsCamera,
): action is {
	type: "assign";
	props: IAppBuilderPropsAssignCamera;
} {
	return action.type === "assign";
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

/** assert action type "sound" */
export function isSoundAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.Sound}
> {
	return isActionType(action, AppBuilderActionType.Sound);
}

/** assert action type "setContainerVisibility" */
export function isSetContainerVisibilityAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.SetContainerVisibility}
> {
	return isActionType(action, AppBuilderActionType.SetContainerVisibility);
}

/** assert action type "messageToParent" */
export function isMessageToParentAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.MessageToParent}
> {
	return isActionType(action, AppBuilderActionType.MessageToParent);
}

type AppBuilderControlLike = IAppBuilderControl | IAppBuilderToolbarItem;

/** assert control / toolbar item type "parameter" */
export function isParameterRefControl<T extends AppBuilderControlLike>(
	control: T,
): control is T & {
	type: "parameter";
	props: IAppBuilderControlParameterRef;
} {
	return control.type === "parameter";
}

/** assert control / toolbar item type "export" */
export function isExportRefControl<T extends AppBuilderControlLike>(
	control: T,
): control is T & {
	type: "export";
	props: IAppBuilderControlExportRef;
} {
	return control.type === "export";
}

/** assert control / toolbar item type "action" */
export function isActionRefControl<T extends AppBuilderControlLike>(
	control: T,
): control is T & {
	type: "action";
	props: IAppBuilderControlActionRef;
} {
	return control.type === "action";
}

/** assert control / toolbar item type "output" */
export function isOutputRefControl<T extends AppBuilderControlLike>(
	control: T,
): control is T & {
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
	 * Whether to hide the default viewport toolbar. Defaults to false.
	 */
	hideDefaultToolbar?: boolean;
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
	/**
	 * If the session should be kept in the store after the first use (default: false)
	 */
	keepInStore?: boolean;
}

/**
 * Settings for a session used by the AppBuilder.
 */
export interface IAppBuilderSettingsJsonSession extends Omit<
	IAppBuilderSettingsSession,
	"modelViewUrl"
> {
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
	/**
	 * URL of the AppBuilderAgent window (Step 3). Query `agentUrl` overrides this.
	 * Not `IAppBuilder.agents[].url`.
	 */
	agentUrl?: string;
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
