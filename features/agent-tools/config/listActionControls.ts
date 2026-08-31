import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {z} from "@AppBuilderLib/shared/lib/zod";

/**
 * Default `filter.types` for list_action_controls when `actions` is omitted.
 * Export actions are not included.
 */
export enum DefaultListActionControlType {
	CreateModelState = AppBuilderActionType.CreateModelState,
	AddToCart = AppBuilderActionType.AddToCart,
	SetParameterValue = AppBuilderActionType.SetParameterValue,
	SetParameterValues = AppBuilderActionType.SetParameterValues,
	Undo = AppBuilderActionType.Undo,
	Redo = AppBuilderActionType.Redo,
	ResetParameterValues = AppBuilderActionType.ResetParameterValues,
	ImportModelState = AppBuilderActionType.ImportModelState,
	Camera = AppBuilderActionType.Camera,
	Sound = AppBuilderActionType.Sound,
}

export const DEFAULT_LIST_ACTION_CONTROL_TYPES = Object.values(
	DefaultListActionControlType,
);

export type ListedActionControl = {
	id: string;
	name: string;
	type: string;
	description?: string;
};

export const listActionControlsInputSchema = z.strictObject({});
