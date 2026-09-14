import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionType";
import type {ActionComponentMapValueType} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {defaultAppBuilderActionRuns} from "@AppBuilderLib/features/appbuilder/model/appBuilderActionCatalog";
import AppBuilderActionAddToCartComponent from "./AppBuilderActionAddToCartComponent";
import AppBuilderActionCloseConfiguratorComponent from "./AppBuilderActionCloseConfiguratorComponent";
import AppBuilderActionCreateModelStateComponent from "./AppBuilderActionCreateModelStateComponent";
import AppBuilderActionExportParameterValuesComponent from "./AppBuilderActionExportParameterValuesComponent";
import AppBuilderActionImportModelStateComponent from "./AppBuilderActionImportModelStateComponent";
import AppBuilderActionImportParameterValuesComponent from "./AppBuilderActionImportParameterValuesComponent";
import AppBuilderActionMessageToParentComponent from "./AppBuilderActionMessageToParentComponent";
import AppBuilderActionRedoComponent from "./AppBuilderActionRedoComponent";
import AppBuilderActionResetParameterValuesComponent from "./AppBuilderActionResetParameterValuesComponent";
import AppBuilderActionSetBrowserLocationComponent from "./AppBuilderActionSetBrowserLocationComponent";
import AppBuilderActionSetContainerVisibilityComponent from "./AppBuilderActionSetContainerVisibilityComponent";
import AppBuilderActionSetParameterValuesComponent from "./AppBuilderActionSetParameterValuesComponent";
import AppBuilderActionSoundComponent from "./AppBuilderActionSoundComponent";
import AppBuilderActionUndoComponent from "./AppBuilderActionUndoComponent";

/**
 * Shared `{ isAction, component, run? }` table (not host-specific).
 * FromType overlays `componentContext.actions` on this. Viewer-specific
 * `ar` / `camera` / `fullscreen` stay host-only so iJewel does not import
 * ShapeDiver viewer UI.
 */
export const sharedAppBuilderActions: Record<
	string,
	ActionComponentMapValueType
> = {
	[AppBuilderActionType.CreateModelState]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.CreateModelState],
		component: AppBuilderActionCreateModelStateComponent,
	},
	[AppBuilderActionType.AddToCart]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.AddToCart],
		component: AppBuilderActionAddToCartComponent,
	},
	[AppBuilderActionType.SetParameterValue]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.SetParameterValue],
		component: AppBuilderActionSetParameterValuesComponent,
	},
	[AppBuilderActionType.SetParameterValues]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.SetParameterValues],
		component: AppBuilderActionSetParameterValuesComponent,
	},
	[AppBuilderActionType.SetBrowserLocation]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.SetBrowserLocation],
		component: AppBuilderActionSetBrowserLocationComponent,
	},
	[AppBuilderActionType.CloseConfigurator]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.CloseConfigurator],
		component: AppBuilderActionCloseConfiguratorComponent,
	},
	[AppBuilderActionType.Undo]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.Undo],
		component: AppBuilderActionUndoComponent,
	},
	[AppBuilderActionType.Redo]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.Redo],
		component: AppBuilderActionRedoComponent,
	},
	[AppBuilderActionType.ResetParameterValues]: {
		...defaultAppBuilderActionRuns[
			AppBuilderActionType.ResetParameterValues
		],
		component: AppBuilderActionResetParameterValuesComponent,
	},
	[AppBuilderActionType.ImportParameterValues]: {
		...defaultAppBuilderActionRuns[
			AppBuilderActionType.ImportParameterValues
		],
		component: AppBuilderActionImportParameterValuesComponent,
	},
	[AppBuilderActionType.ExportParameterValues]: {
		...defaultAppBuilderActionRuns[
			AppBuilderActionType.ExportParameterValues
		],
		component: AppBuilderActionExportParameterValuesComponent,
	},
	[AppBuilderActionType.ImportModelState]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.ImportModelState],
		component: AppBuilderActionImportModelStateComponent,
	},
	[AppBuilderActionType.Sound]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.Sound],
		component: AppBuilderActionSoundComponent,
	},
	[AppBuilderActionType.MessageToParent]: {
		...defaultAppBuilderActionRuns[AppBuilderActionType.MessageToParent],
		component: AppBuilderActionMessageToParentComponent,
	},
	[AppBuilderActionType.SetContainerVisibility]: {
		...defaultAppBuilderActionRuns[
			AppBuilderActionType.SetContainerVisibility
		],
		component: AppBuilderActionSetContainerVisibilityComponent,
	},
};
