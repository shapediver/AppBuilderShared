import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionType";
import {z} from "@AppBuilderLib/shared/lib/zod";

/**
 * Default `filter.types` for list_action_controls when `actions` is omitted.
 * Export actions are not included.
 */
export const DEFAULT_LIST_ACTION_CONTROL_TYPES = [
	AppBuilderActionType.CreateModelState,
	AppBuilderActionType.AddToCart,
	AppBuilderActionType.SetParameterValue,
	AppBuilderActionType.SetParameterValues,
	AppBuilderActionType.Undo,
	AppBuilderActionType.Redo,
	AppBuilderActionType.ResetParameterValues,
	AppBuilderActionType.ImportModelState,
	AppBuilderActionType.Camera,
	AppBuilderActionType.Sound,
] as const satisfies readonly AppBuilderActionType[];

export type DefaultListActionControlType =
	(typeof DEFAULT_LIST_ACTION_CONTROL_TYPES)[number];

export type ListedActionControl = {
	id: string;
	name: string;
	type: string;
	description?: string;
};

export const listActionControlsInputSchema = z.strictObject({});
