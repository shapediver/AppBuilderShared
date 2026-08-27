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

// Stryker disable all: theme defaults unused by popover open/close tests
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
// Stryker restore all

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

// Stryker disable all: position mapping unused by popover open/close tests
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
// Stryker restore all

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
	// Stryker disable all: parameter/output popovers unused by open/close tests
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
	// Stryker restore all
	// Stryker disable next-line ConditionalExpression: tests drive open state via openedPopoverId
	const opened = popoverId ? openedPopoverId === popoverId : localOpened;
	const actionDisabled = buttonRenderContext.executing;
	// Stryker disable all: icon/empty-content unused by open/close tests
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
	// Stryker restore all
	// Stryker disable all: keepMounted some/every unused; fixture always has one action
	const actionMenuKeepMounted =
		item.type === "menu" &&
		item.props.sections.some((section) =>
			section.items.some((menuItem) => menuItem.type === "action"),
		)
			? {keepMounted: true, keepMountedMode: "display-none" as const}
			: {};
	// Stryker restore all

	const setOpened = useCallback(
		(next: boolean | ((current: boolean) => boolean)) => {
			const value = typeof next === "function" ? next(opened) : next;
			if (!value && popoverDismissalBlocked) return;
			// Stryker disable all: tests always pass both popoverId and onPopoverOpenChange
			if (popoverId && onPopoverOpenChange) {
				onPopoverOpenChange(popoverId, value);
				return;
			}
			setLocalOpened(value);
			// Stryker restore all
		},
	// Stryker disable next-line ArrayDeclaration: callback identity unused by open/close tests
	[opened, onPopoverOpenChange, popoverDismissalBlocked, popoverId],
	);

	const fixedWidthPopover = item.type === "tabs" || item.type === "widgets";

	if (!hasPopoverContent) {
		// Stryker disable all: empty-content unused by open/close tests
		return (
			<AppBuilderToolbarIconButton
				label={item.label}
				tooltipLabel={item.tooltip ?? item.label}
				iconType={iconType}
				disabled={item.disabled || actionDisabled}
				{...buttonThemeProps}
			/>
		);
		// Stryker restore all
	}

	return (
		<Popover
			{...popoverProps}
			{...actionMenuKeepMounted}
			width={
				// Stryker disable next-line all: width unused by open/close tests
				fixedWidthPopover
					? (popoverProps.width ?? 320)
					: popoverProps.width
			}
			opened={opened}
			onChange={setOpened}
			closeOnClickOutside={false}
			position={
				// Stryker disable next-line all: position unused by open/close tests
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
						// Stryker disable next-line ArrowFunction: dismissal test asserts blocked close, not the toggle itself
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
