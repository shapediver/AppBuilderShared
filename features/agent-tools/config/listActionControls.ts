import type {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {z} from "zod";

export const DEFAULT_LIST_ACTION_CONTROL_TYPES: AppBuilderActionType[] = [
	"createModelState",
	"addToCart",
	"setParameterValue",
	"setParameterValues",
	"undo",
	"redo",
	"resetParameterValues",
	"importModelState",
	"camera",
	"sound",
];

export type ListedActionControl = {
	id: string;
	name: string;
	type: AppBuilderActionType;
	description?: string;
};

export const listActionControlsInputSchema = z.strictObject({});
