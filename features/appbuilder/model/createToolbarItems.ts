import type {
	ToolbarCheckboxItem,
	ToolbarCommandItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";

/** Creates a runtime toolbar command independently of its feature domain. */
export const createToolbarCommand = ({
	execute,
	batchUpdate,
	...item
}: Omit<ToolbarCommandItem, "type" | "props"> & {
	execute: () => void | Promise<void>;
	batchUpdate?: ToolbarCommandItem["props"]["batchUpdate"];
}): ToolbarCommandItem => ({
	type: "command",
	...item,
	props: {execute, batchUpdate},
});

/** Creates a runtime toolbar checkbox independently of its feature domain. */
export const createToolbarCheckboxItem = ({
	checked,
	readOnly,
	setChecked,
	trailingAction,
	...item
}: Omit<ToolbarCheckboxItem, "type" | "props"> &
	ToolbarCheckboxItem["props"]): ToolbarCheckboxItem => ({
	type: "checkbox",
	...item,
	props: {checked, readOnly, setChecked, trailingAction},
});
