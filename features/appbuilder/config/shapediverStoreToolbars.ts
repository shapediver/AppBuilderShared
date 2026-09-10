import {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {
	AppBuilderToolbarAlign,
	AppBuilderToolbarSide,
	AppBuilderToolbarVisibility,
	IAppBuilderToolbarControlItem,
	IAppBuilderToolbarItem,
} from "./appbuilder";
import type {
	ToolbarAcceptRejectItem,
	ToolbarCheckboxItem,
	ToolbarCommandItem,
	ToolbarMenuModel,
} from "./toolbarRenderTypes";

export type ToolbarSource = "definition" | "default" | "runtime";

/** Runtime toolbar controls use the same generic command/menu models as the UI. */
export type ToolbarItem =
	| IAppBuilderToolbarItem
	| ToolbarAcceptRejectItem
	| ToolbarCommandItem
	| ToolbarCheckboxItem
	| ToolbarMenuModel;
export type ToolbarGroups = ToolbarItem[][];

export function isToolbarActionItem(
	item: ToolbarItem,
): item is Extract<ToolbarItem, {type: "action"}> {
	return item.type === "action";
}

export function isToolbarActionMenuItem(
	item: ToolbarItem,
): item is Extract<ToolbarItem, {type: "actionMenu"}> {
	return item.type === "actionMenu";
}

export function isToolbarWidgetPanelItem(
	item: ToolbarItem,
): item is Extract<ToolbarItem, {type: "widgets"}> {
	return item.type === "widgets";
}

export function isToolbarTabbedPanelItem(
	item: ToolbarItem,
): item is Extract<ToolbarItem, {type: "tabs"}> {
	return item.type === "tabs";
}

export function isToolbarMenuModel(
	item: ToolbarItem,
): item is Extract<ToolbarItem, {type: "menu"}> {
	return item.type === "menu";
}

export interface ToolbarRegistration {
	id: string;
	source: ToolbarSource;
	viewportId?: string;
	side: AppBuilderToolbarSide;
	align: AppBuilderToolbarAlign;
	order: number;
	definitionIndex?: number;
	visibility: AppBuilderToolbarVisibility;
	ariaLabel?: string;
	defaultIcon?: IconType;
	groups: ToolbarGroups;
}

export interface ToolbarRuntimeTarget {
	toolbarId?: string;
	fallbackSide: AppBuilderToolbarSide;
	fallbackAlign: AppBuilderToolbarAlign;
	createIfMissing?: boolean;
	groupIndex?: number;
	order?: number;
}

export interface ToolbarRuntimeTokenEntry {
	toolbarId: string;
	groupIndex: number;
	items: IAppBuilderToolbarControlItem[];
}

export interface IShapeDiverStoreToolbars {
	definitionToolbars: ToolbarRegistration[];
	defaultToolbars: ToolbarRegistration[];
	runtimeToolbars: ToolbarRegistration[];
	runtimeTokens: Record<string, ToolbarRuntimeTokenEntry>;
	toolbarOpen: Record<string, boolean>;

	setDefinitionToolbars: (toolbars: ToolbarRegistration[]) => void;
	resetDefinitionToolbars: () => void;
	setDefaultToolbar: (toolbar: ToolbarRegistration) => void;
	removeDefaultToolbar: (toolbarId: string) => void;
	addRuntimeToolbarControls: (
		target: ToolbarRuntimeTarget,
		items: IAppBuilderToolbarControlItem[],
	) => string | undefined;
	removeRuntimeToolbarToken: (token: string) => boolean;
	setToolbarOpen: (toolbarId: string, open: boolean) => void;
	selectMergedToolbars: (viewportId?: string) => ToolbarRegistration[];
}
