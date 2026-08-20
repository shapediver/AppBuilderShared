import type {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {DefaultListActionControlType} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {z} from "@AppBuilderLib/shared/lib/zod";

export {DefaultListActionControlType};

export const DEFAULT_LIST_ACTION_CONTROL_TYPES: AppBuilderActionType[] =
	Object.values(DefaultListActionControlType);

export type ListedActionControl = {
	id: string;
	name: string;
	type: AppBuilderActionType;
	description?: string;
};

export const listActionControlsInputSchema = z.strictObject({});
