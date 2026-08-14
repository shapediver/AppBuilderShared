import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {PropsParameter} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderLib/entities/viewport/config/viewport";
import {AppBuilderToolbarButtonThemeDefaultProps} from "@AppBuilderLib/features/appbuilder/config/AppBuilderToolbarButton.theme.types";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import type {ToolbarPopoverItem} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import AppBuilderToolbarIconButton, {
	AppBuilderToolbarIconButtonDefaultStyleProps,
} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import {Popover, useProps} from "@mantine/core";
import React, {useCallback, useContext, useMemo, useState} from "react";
import AppBuilderToolbarPopoverContent from "./AppBuilderToolbarPopoverContent";

type ToolbarPopoverProps = Partial<React.ComponentProps<typeof Popover>>;
type ToolbarButtonThemeProps = AppBuilderToolbarButtonThemeDefaultProps & {
	popoverProps?: ToolbarPopoverProps;
};

const defaultStyleProps = {
	...AppBuilderToolbarIconButtonDefaultStyleProps,
	tooltipWrapperProps: {},
	popoverProps: {shadow: "md", withinPortal: true} as ToolbarPopoverProps,
	popoverDropdownProps: {
		style: {
			padding: 4,
			maxWidth: 320,
			...ViewportTransparentBackgroundStyle,
		},
	},
	menuStackProps: {gap: 0},
	menuSectionStackProps: {},
	menuDividerProps: {style: {marginBlock: 4}},
};

type Props = {
	item: ToolbarPopoverItem;
	buttonRenderContext: ButtonRenderContext;
	defaultIcon?: ToolbarPopoverItem["icon"];
	toolbarSide?: ToolbarRegistration["side"];
	popoverId?: string;
	openedPopoverId?: string;
	onPopoverOpenChange?: (popoverId: string, open: boolean) => void;
	popoverDismissalBlocked?: boolean;
};

const getPopoverPosition = (toolbarSide?: ToolbarRegistration["side"]) => {
	switch (toolbarSide) {
		case "left":
			return "right";
		case "right":
			return "left";
		case "bottom":
			return "top";
		default:
			return "bottom";
	}
};

/** Owns trigger/open-state behavior for resolved toolbar popovers only. */
export default function AppBuilderToolbarPopoverButton({
	item,
	buttonRenderContext,
	defaultIcon,
	toolbarSide,
	popoverId,
	openedPopoverId,
	onPopoverOpenChange,
	popoverDismissalBlocked = false,
}: Props) {
	const componentContext = useContext(ComponentContext);
	const [localOpened, setLocalOpened] = useState(false);
	const {
		popoverProps = defaultStyleProps.popoverProps,
		popoverDropdownProps = defaultStyleProps.popoverDropdownProps,
		menuStackProps = defaultStyleProps.menuStackProps,
		menuSectionStackProps = defaultStyleProps.menuSectionStackProps,
		menuDividerProps = defaultStyleProps.menuDividerProps,
		...buttonThemeProps
	} = useProps(
		"AppBuilderToolbarButton",
		defaultStyleProps,
		{},
	) as ToolbarButtonThemeProps;
	const parameterProps = useMemo<PropsParameter[]>(() => {
		if (item.type !== "parameter") return [];
		const parameterItem = item.props;
		return [
			{
				namespace:
					parameterItem.sessionId ?? buttonRenderContext.namespace,
				parameterId: parameterItem.name,
				disableIfDirty: parameterItem.disableIfDirty,
				acceptRejectMode: parameterItem.acceptRejectMode,
				overrides: parameterItem.overrides,
				delegates: (parameterItem.delegates ?? []).map((delegate) => ({
					namespace:
						delegate.sessionId ?? buttonRenderContext.namespace,
					parameterId: delegate.name,
				})),
			},
		];
	}, [buttonRenderContext.namespace, item]);
	const outputProps = useMemo<PropsOutput[]>(() => {
		if (item.type !== "output") return [];
		const outputItem = item.props;
		return [
			{
				namespace:
					outputItem.sessionId ?? buttonRenderContext.namespace,
				outputId: outputItem.name,
				overrides: outputItem.overrides,
			},
		];
	}, [buttonRenderContext.namespace, item]);
	const opened = popoverId ? openedPopoverId === popoverId : localOpened;
	const actionDisabled = buttonRenderContext.executing;
	const iconType =
		item.icon ?? defaultIcon ?? item.label.slice(0, 1).toUpperCase();
	const hasPopoverContent =
		item.type === "menu"
			? item.props.sections.some((section) => section.items.length > 0)
			: item.type === "widgets"
				? item.props.widgets.length > 0
				: item.type === "tabs"
					? item.props.tabs.length > 0
					: true;
	const actionMenuKeepMounted =
		item.type === "menu" &&
		item.props.sections.some((section) =>
			section.items.some((menuItem) => menuItem.type === "action"),
		)
			? {keepMounted: true, keepMountedMode: "display-none" as const}
			: {};

	const setOpened = useCallback(
		(next: boolean | ((current: boolean) => boolean)) => {
			const value = typeof next === "function" ? next(opened) : next;
			if (!value && popoverDismissalBlocked) return;
			if (popoverId && onPopoverOpenChange) {
				onPopoverOpenChange(popoverId, value);
				return;
			}
			setLocalOpened(value);
		},
		[opened, onPopoverOpenChange, popoverDismissalBlocked, popoverId],
	);

	const fixedWidthPopover = item.type === "tabs" || item.type === "widgets";

	if (!hasPopoverContent) {
		return (
			<AppBuilderToolbarIconButton
				label={item.label}
				tooltipLabel={item.tooltip ?? item.label}
				iconType={iconType}
				disabled={item.disabled || actionDisabled}
				{...buttonThemeProps}
			/>
		);
	}

	return (
		<Popover
			{...popoverProps}
			{...actionMenuKeepMounted}
			width={
				fixedWidthPopover
					? (popoverProps.width ?? 320)
					: popoverProps.width
			}
			opened={opened}
			onChange={setOpened}
			closeOnClickOutside={false}
			position={
				("position" in popoverProps
					? popoverProps.position
					: undefined) ?? getPopoverPosition(toolbarSide)
			}
		>
			<Popover.Target>
				<span
					data-appbuilder-toolbar-trigger="true"
					style={{display: "inline-flex"}}
				>
					<AppBuilderToolbarIconButton
						label={item.label}
						tooltipLabel={
							opened ? "" : (item.tooltip ?? item.label)
						}
						iconType={iconType}
						disabled={item.disabled || actionDisabled}
						onClick={() => setOpened((current) => !current)}
						{...buttonThemeProps}
					/>
				</span>
			</Popover.Target>
			<Popover.Dropdown
				{...popoverDropdownProps}
				data-appbuilder-toolbar-popover="true"
				style={{
					...defaultStyleProps.popoverDropdownProps.style,
					...popoverDropdownProps?.style,
				}}
			>
				<AppBuilderToolbarPopoverContent
					item={item}
					componentContext={componentContext}
					namespace={buttonRenderContext.namespace}
					viewportId={buttonRenderContext.viewportId}
					fullscreenId={buttonRenderContext.fullscreenId}
					actionDisabled={actionDisabled}
					parameterProps={parameterProps}
					outputProps={outputProps}
					menuStackProps={menuStackProps}
					menuSectionStackProps={menuSectionStackProps}
					menuDividerProps={menuDividerProps}
					onActionActivate={() => setOpened(false)}
				/>
			</Popover.Dropdown>
		</Popover>
	);
}
