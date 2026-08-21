import {z} from "@AppBuilderLib/shared/lib/zod";

/**
 * Default `filter.types` for list_action_controls when `actions` is omitted.
 * Export actions are not included.
 */
export enum DefaultListActionControlType {
	CreateModelState = "createModelState",
	AddToCart = "addToCart",
	SetParameterValue = "setParameterValue",
	SetParameterValues = "setParameterValues",
	Undo = "undo",
	Redo = "redo",
	ResetParameterValues = "resetParameterValues",
	ImportModelState = "importModelState",
	Camera = "camera",
	Sound = "sound",
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
