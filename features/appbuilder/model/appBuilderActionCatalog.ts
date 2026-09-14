import {
	isAddToCartAction,
	isCloseConfiguratorAction,
	isCreateModelStateAction,
	isExportParameterValuesAction,
	isImportModelStateAction,
	isImportParameterValuesAction,
	isMessageToParentAction,
	isRedoAction,
	isResetParameterValuesAction,
	isSetBrowserLocationAction,
	isSetContainerVisibilityAction,
	isSetParameterValueAction,
	isSetParameterValuesAction,
	isSoundAction,
	isUndoAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	type AppBuilderActionRunRegistration,
	type AppBuilderActionRunner,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionType";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {runAppBuilderActionAddToCart} from "./runAppBuilderActionAddToCart";
import {runAppBuilderActionCloseConfigurator} from "./runAppBuilderActionCloseConfigurator";
import {runAppBuilderActionCreateModelState} from "./runAppBuilderActionCreateModelState";
import {runAppBuilderActionExportParameterValues} from "./runAppBuilderActionExportParameterValues";
import {runAppBuilderActionImportParameterValues} from "./runAppBuilderActionImportParameterValues";
import {runAppBuilderActionMessageToParent} from "./runAppBuilderActionMessageToParent";
import {runAppBuilderActionRedo} from "./runAppBuilderActionRedo";
import {runAppBuilderActionResetParameterValues} from "./runAppBuilderActionResetParameterValues";
import {runAppBuilderActionSetBrowserLocation} from "./runAppBuilderActionSetBrowserLocation";
import {runAppBuilderActionSetContainerVisibility} from "./runAppBuilderActionSetContainerVisibility";
import {runAppBuilderActionSetParameterValues} from "./runAppBuilderActionSetParameterValues";
import {runAppBuilderActionSound} from "./runAppBuilderActionSound";
import {runAppBuilderActionUndo} from "./runAppBuilderActionUndo";

const runSetParameterValues: AppBuilderActionRunner = async (
	definition,
	context,
) => {
	if (
		!isSetParameterValueAction(definition) &&
		!isSetParameterValuesAction(definition)
	) {
		return;
	}
	await runAppBuilderActionSetParameterValues(definition.props, context);
};

const runSetContainerVisibility: AppBuilderActionRunner = (
	definition,
	context,
) => {
	if (!isSetContainerVisibilityAction(definition)) return;
	runAppBuilderActionSetContainerVisibility({
		...definition.props,
		viewportId: resolvedViewportId(context),
	});
};

const runImportModelState: AppBuilderActionRunner = async () => {
	Logger.warn(
		"importModelState requires its dialog and is skipped inside executeActions.",
	);
};

/**
 * Shared headless executors. Do not add `ar` / `camera` / `fullscreen` here —
 * those import viewer UI into every host. ShapeDiver registers them from
 * `AppBuilderRoot`; iJewel omits the key, sets `run` undefined, or supplies a
 * native `run`.
 */
export const defaultAppBuilderActionRuns: Record<
	string,
	AppBuilderActionRunRegistration
> = {
	[AppBuilderActionType.CreateModelState]: {
		isAction: isCreateModelStateAction,
		run: async (definition, context) => {
			if (!isCreateModelStateAction(definition)) return;
			await runAppBuilderActionCreateModelState(
				definition.props,
				context,
			);
		},
	},
	[AppBuilderActionType.AddToCart]: {
		isAction: isAddToCartAction,
		run: async (definition, context) => {
			if (!isAddToCartAction(definition)) return;
			await runAppBuilderActionAddToCart(definition.props, context);
		},
	},
	[AppBuilderActionType.SetParameterValue]: {
		isAction: isSetParameterValueAction,
		run: runSetParameterValues,
	},
	[AppBuilderActionType.SetParameterValues]: {
		isAction: isSetParameterValuesAction,
		run: runSetParameterValues,
	},
	[AppBuilderActionType.SetBrowserLocation]: {
		isAction: isSetBrowserLocationAction,
		run: async (definition, context) => {
			if (!isSetBrowserLocationAction(definition)) return;
			await runAppBuilderActionSetBrowserLocation(
				definition.props,
				context,
			);
		},
	},
	[AppBuilderActionType.CloseConfigurator]: {
		isAction: isCloseConfiguratorAction,
		run: async () => {
			await runAppBuilderActionCloseConfigurator();
		},
	},
	[AppBuilderActionType.Undo]: {
		isAction: isUndoAction,
		run: async () => {
			await runAppBuilderActionUndo();
		},
	},
	[AppBuilderActionType.Redo]: {
		isAction: isRedoAction,
		run: async () => {
			await runAppBuilderActionRedo();
		},
	},
	[AppBuilderActionType.ResetParameterValues]: {
		isAction: isResetParameterValuesAction,
		run: async (_definition, context) => {
			await runAppBuilderActionResetParameterValues(context.namespace);
		},
	},
	[AppBuilderActionType.ImportParameterValues]: {
		isAction: isImportParameterValuesAction,
		run: async (_definition, context) => {
			await runAppBuilderActionImportParameterValues(context.namespace);
		},
	},
	[AppBuilderActionType.ExportParameterValues]: {
		isAction: isExportParameterValuesAction,
		run: async (_definition, context) => {
			await runAppBuilderActionExportParameterValues(context.namespace);
		},
	},
	[AppBuilderActionType.ImportModelState]: {
		isAction: isImportModelStateAction,
		run: runImportModelState,
	},
	[AppBuilderActionType.Sound]: {
		isAction: isSoundAction,
		run: async (definition) => {
			if (!isSoundAction(definition)) return;
			await runAppBuilderActionSound(definition.props);
		},
	},
	[AppBuilderActionType.MessageToParent]: {
		isAction: isMessageToParentAction,
		run: async (definition) => {
			if (!isMessageToParentAction(definition)) return;
			await runAppBuilderActionMessageToParent(definition.props);
		},
	},
	[AppBuilderActionType.SetContainerVisibility]: {
		isAction: isSetContainerVisibilityAction,
		run: runSetContainerVisibility,
	},
};
