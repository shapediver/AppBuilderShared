import type {
	ICameraOptions,
	OrthographicCameraProperties,
	PerspectiveCameraProperties,
} from "@shapediver/viewer.shared.types";
import type {
	IAppBuilderContainer,
	IAppBuilderIcon,
	IAppBuilderImageRef,
	IAppBuilderParameterRef,
	IAppBuilderParameterValueSourceDefinition,
	IAppBuilderParameterValueSourcePropsScreenshot,
} from "./appbuilder";
import {AppBuilderActionType} from "./appBuilderActionType";

/**
 * JSON types for App Builder actions (toolbar, widgets, action slots,
 * `executeActions`). Runtime runners live elsewhere; this file only
 * describes the shape. E-commerce `triggerAction` reuses these prop
 * types; its allowlist lives in `ecommerceapi.ts`.
 *
 * Imports icon / container / parameter-ref / value-source types from
 * `appbuilder.ts` (type-only cycle, same pattern as `appbuilderActionSlots.ts`).
 */

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
	  }
	| {
			type: AppBuilderActionType.ExecuteActions;
			props: IAppBuilderActionPropsExecuteActions;
	  };

/** Common properties of App Builder action controls and legacy actions. */
export interface IAppBuilderActionPropsCommon {
	/** Optional identifier of the action. Used to uniquely reference actions in agent definitions, etc. */
	id?: string;
	/** Label (of the button etc). Optional, defaults to a value depending on the type of action. Set to empty string to show only an icon. */
	label?: string;
	/** Optional icon name, image URL, or inline Iconify object (of the button etc). */
	icon?: IAppBuilderIcon;
	/** Optional tooltip. */
	tooltip?: string;
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
 * Properties of an "executeActions" action.
 *
 * Nested `executeActions` definitions are allowed, so parallel and sequential
 * groups can be composed freely.
 *
 * @docAttached
 * @category feature
 * @configPath actions.executeActions.props
 * @displayName IAppBuilderActionPropsExecuteActions
 */
export interface IAppBuilderActionPropsExecuteActions {
	/** Actions to trigger. */
	actions: IAppBuilderActionDefinition[];
	/**
	 * Whether actions are triggered simultaneously or one after another.
	 * Defaults to "parallel".
	 */
	mode?: "parallel" | "sequential";
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
export type IAppBuilderPropsAssignCamera = IAppBuilderPropsCameraCommon & {
	camera: NonNullable<IAppBuilderPropsCameraCommon["camera"]>;
};

/** Properties of a "set" action, where the camera is defined by position and target. */
export type IAppBuilderPropsSetCamera = {
	/** The position of the camera. */
	position: [number, number, number];
	/** The target the camera is looking at. */
	target: [number, number, number];
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
	/** Optional viewport id. Defaults to the containing viewport. */
	viewportId?: string;
} & IAppBuilderActionPropsCommon &
	(
		| {
				type: "animate";
				props: IAppBuilderPropsAnimateCamera;
		  }
		| {
				type: "assign";
				props: IAppBuilderPropsAssignCamera;
		  }
		| {
				type: "set";
				props: IAppBuilderPropsSetCamera;
		  }
		| {
				type: "reset";
				props: IAppBuilderPropsResetCamera;
		  }
		| {
				type: "zoomTo";
				props: IAppBuilderPropsZoomToCamera;
		  }
	);

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
	/** Icon name, image URL, or inline Iconify object to show when the sound is playing. */
	iconPlaying?: IAppBuilderIcon;
};

/** Properties of a legacy "sound" action. */
export type IAppBuilderLegacyActionPropsSound = IAppBuilderActionPropsSound &
	IAppBuilderActionPropsCommon;

/** Properties of a legacy "setContainerVisibility" action. */
export type IAppBuilderLegacyActionPropsSetContainerVisibility =
	IAppBuilderActionPropsSetContainerVisibility & IAppBuilderActionPropsCommon;

/** Properties of a legacy "executeActions" action. */
export type IAppBuilderLegacyActionPropsExecuteActions =
	IAppBuilderActionPropsExecuteActions & IAppBuilderActionPropsCommon;

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
export type IAppBuilderLegacyActionDefinition =
	| {
			type: AppBuilderActionType.CreateModelState;
			props: IAppBuilderLegacyActionPropsCreateModelState;
	  }
	| {
			type: AppBuilderActionType.AddToCart;
			props: IAppBuilderLegacyActionPropsAddToCart;
	  }
	| {
			type: AppBuilderActionType.SetParameterValue;
			props: IAppBuilderLegacyActionPropsSetParameterValue;
	  }
	| {
			type: AppBuilderActionType.SetParameterValues;
			props: IAppBuilderLegacyActionPropsSetParameterValues;
	  }
	| {
			type: AppBuilderActionType.SetBrowserLocation;
			props: IAppBuilderLegacyActionPropsSetBrowserLocation;
	  }
	| {
			type: AppBuilderActionType.CloseConfigurator;
			props: IAppBuilderLegacyActionPropsCloseConfigurator;
	  }
	| {type: AppBuilderActionType.Ar; props: IAppBuilderLegacyActionPropsAr}
	| {
			type: AppBuilderActionType.Fullscreen;
			props: IAppBuilderLegacyActionPropsFullscreen;
	  }
	| {type: AppBuilderActionType.Undo; props: IAppBuilderLegacyActionPropsUndo}
	| {type: AppBuilderActionType.Redo; props: IAppBuilderLegacyActionPropsRedo}
	| {
			type: AppBuilderActionType.ResetParameterValues;
			props: IAppBuilderLegacyActionPropsResetParameterValues;
	  }
	| {
			type: AppBuilderActionType.ImportParameterValues;
			props: IAppBuilderLegacyActionPropsImportParameterValues;
	  }
	| {
			type: AppBuilderActionType.ExportParameterValues;
			props: IAppBuilderLegacyActionPropsExportParameterValues;
	  }
	| {
			type: AppBuilderActionType.ImportModelState;
			props: IAppBuilderLegacyActionPropsImportModelState;
	  }
	| {
			type: AppBuilderActionType.Camera;
			props: IAppBuilderLegacyActionPropsCamera;
	  }
	| {
			type: AppBuilderActionType.Sound;
			props: IAppBuilderLegacyActionPropsSound;
	  }
	| {
			type: AppBuilderActionType.SetContainerVisibility;
			props: IAppBuilderLegacyActionPropsSetContainerVisibility;
	  }
	| {
			type: AppBuilderActionType.MessageToParent;
			props: IAppBuilderLegacyActionPropsMessageToParent;
	  }
	| {
			type: AppBuilderActionType.ExecuteActions;
			props: IAppBuilderLegacyActionPropsExecuteActions;
	  };

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

/** assert action type "executeActions" */
export function isExecuteActionsAction(
	action: IAppBuilderActionDefinition,
): action is Extract<
	IAppBuilderActionDefinition,
	{type: AppBuilderActionType.ExecuteActions}
> {
	return isActionType(action, AppBuilderActionType.ExecuteActions);
}
