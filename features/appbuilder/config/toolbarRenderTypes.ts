import type {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import type {
	IAppBuilderControlActionRef,
	IAppBuilderToolbarExportItem,
	IAppBuilderToolbarOutputItem,
	IAppBuilderToolbarParameterItem,
	IAppBuilderToolbarTabbedPanelItem,
	IAppBuilderToolbarWidgetPanelItem,
} from "./appbuilder";
import type {ToolbarRegistration} from "./shapediverStoreToolbars";

export type ToolbarItemBase<TType extends string, TProps> = {
	id: string;
	type: TType;
	label: string;
	icon?: IconType;
	tooltip?: string;
	disabled?: boolean;
	props: TProps;
};

/** A declarative App Builder action rendered in a toolbar or toolbar menu. */
export type ToolbarActionItem = ToolbarItemBase<
	"action",
	IAppBuilderControlActionRef
> & {
	presentation?: "button" | "item";
};

export type ToolbarParameterItem = ToolbarItemBase<
	"parameter",
	IAppBuilderToolbarParameterItem["props"]
>;

export type ToolbarExportItem = ToolbarItemBase<
	"export",
	IAppBuilderToolbarExportItem["props"]
>;

export type ToolbarOutputItem = ToolbarItemBase<
	"output",
	IAppBuilderToolbarOutputItem["props"]
>;

export type ToolbarWidgetsItem = ToolbarItemBase<
	"widgets",
	IAppBuilderToolbarWidgetPanelItem["props"]
>;

export type ToolbarTabsItem = ToolbarItemBase<
	"tabs",
	IAppBuilderToolbarTabbedPanelItem["props"]
>;

/** A runtime operation rendered as a toolbar button or menu row. */
export type ToolbarCommandItem = ToolbarItemBase<
	"command",
	{
		execute: () => void | Promise<void>;
		batchUpdate?: {
			namespace: string;
			parameterId: string;
			value: unknown;
			prepare: () => void;
		};
	}
> & {
	/** Commands with the same aggregation id become one toolbar button. */
	aggregationId?: string;
	/** Stable presentation order after commands are aggregated. */
	order?: number;
};

/** A runtime checkbox rendered in a toolbar menu. */
export type ToolbarCheckboxItem = ToolbarItemBase<
	"checkbox",
	{
		checked: boolean;
		readOnly?: boolean;
		setChecked: (checked: boolean) => void;
		/** Optional parameter-scoped action displayed beside the checkbox. */
		trailingAction?: {
			label: string;
			icon: IconType;
			execute: () => void;
			disabled?: boolean;
		};
	}
>;

export type ToolbarMenuItem =
	| ToolbarActionItem
	| ToolbarCommandItem
	| ToolbarCheckboxItem;

export type ToolbarMenuSection = {
	id: string;
	items: ToolbarMenuItem[];
};

/** A generic toolbar popover menu. */
export type ToolbarMenuModel = ToolbarItemBase<
	"menu",
	{sections: ToolbarMenuSection[]}
>;

/** Presentation metadata supplied by a runtime toolbar contributor. */
export type RuntimeToolbarMenuDefinition = Pick<
	ToolbarMenuModel,
	"id" | "label" | "icon"
> & {
	sectionId?: string;
};

export type RuntimeToolbarMenuVisibility = "always" | "multipleToggleable";

/** Every resolved item that can own a toolbar popover. */
export type ToolbarPopoverItem =
	| ToolbarMenuModel
	| ToolbarParameterItem
	| ToolbarOutputItem
	| ToolbarWidgetsItem
	| ToolbarTabsItem;

/** Every resolved item rendered by the standard toolbar button component. */
export type ToolbarButtonItem =
	| ToolbarActionItem
	| ToolbarExportItem
	| ToolbarPopoverItem;

/** Every resolved item rendered in a toolbar group. */
export type ToolbarRenderItem =
	| ToolbarButtonItem
	| ToolbarCommandItem
	| ToolbarCheckboxItem;

export type ResolvedToolbarRegistration = Omit<
	ToolbarRegistration,
	"groups"
> & {
	groups: ToolbarRenderItem[][];
};
