import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {useExports} from "@AppBuilderLib/entities/export/model/useExports";
import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {PropsParameter} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderLib/entities/viewport/config/viewport";
import {
	IAppBuilderToolbarItem,
	isActionRefControl,
	isExportRefControl,
	isOutputRefControl,
	isParameterRefControl,
	isToolbarActionMenuItem,
	isToolbarTabbedPanelItem,
	isToolbarWidgetPanelItem,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderToolbarButtonThemeDefaultProps} from "@AppBuilderLib/features/appbuilder/config/AppBuilderToolbarButton.theme.types";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import AppBuilderToolbarIconButton, {
	AppBuilderToolbarIconButtonDefaultStyleProps,
} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton";
import {Popover, useProps} from "@mantine/core";
import React, {useCallback, useContext, useMemo, useState} from "react";
import {AppBuilderActionFromType} from "./AppBuilderActionFromType";
import AppBuilderExportToolbarButton from "./AppBuilderExportToolbarButton";
import {
	getToolbarActionRef,
	getTriggerIconType,
} from "./appBuilderToolbarButtonShared";
import AppBuilderToolbarPopoverContent from "./AppBuilderToolbarPopoverContent";

type ToolbarPopoverProps = Partial<React.ComponentProps<typeof Popover>>;

type ToolbarButtonThemeProps = AppBuilderToolbarButtonThemeDefaultProps & {
	popoverProps?: ToolbarPopoverProps;
};

const defaultStyleProps = {
	...AppBuilderToolbarIconButtonDefaultStyleProps,
	tooltipWrapperProps: {},
	popoverProps: {
		shadow: "md",
		withinPortal: true,
	} as ToolbarPopoverProps,
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

interface Props {
	toolbarItem: IAppBuilderToolbarItem;
	buttonRenderContext: ButtonRenderContext;
	defaultIcon?: IAppBuilderToolbarItem["icon"];
	toolbarSide?: ToolbarRegistration["side"];
	popoverId?: string;
	openedPopoverId?: string;
	onPopoverOpenChange?: (popoverId: string, open: boolean) => void;
	hasActiveInteractionRequest?: boolean;
}

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

export default function AppBuilderToolbarButton({
	toolbarItem,
	buttonRenderContext,
	defaultIcon,
	toolbarSide,
	popoverId,
	openedPopoverId,
	onPopoverOpenChange,
	hasActiveInteractionRequest = false,
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

	const label = useMemo(() => {
		if (toolbarItem.label) return toolbarItem.label;
		if (isParameterRefControl(toolbarItem)) return toolbarItem.props.name;
		if (isExportRefControl(toolbarItem)) return toolbarItem.props.name;
		if (isOutputRefControl(toolbarItem)) return toolbarItem.props.name;
		if (isActionRefControl(toolbarItem)) {
			return (
				toolbarItem.props.label ||
				toolbarItem.props.tooltip ||
				toolbarItem.props.definition.type
			);
		}
		return "Toolbar item";
	}, [toolbarItem]);
	const tooltip = toolbarItem.tooltip ?? label;
	const parameterProps = useMemo<PropsParameter[]>(() => {
		if (!isParameterRefControl(toolbarItem)) return [];
		const p = toolbarItem.props;
		return [
			{
				namespace: p.sessionId ?? buttonRenderContext.namespace,
				parameterId: p.name,
				disableIfDirty: p.disableIfDirty,
				acceptRejectMode: p.acceptRejectMode,
				overrides: p.overrides,
			},
		];
	}, [buttonRenderContext.namespace, toolbarItem]);
	const exportProps = useMemo<PropsExport[]>(() => {
		if (!isExportRefControl(toolbarItem)) return [];
		const p = toolbarItem.props;
		return [
			{
				namespace: p.sessionId ?? buttonRenderContext.namespace,
				exportId: p.name,
				overrides: p.overrides,
				parameterValues: p.parameterValues,
			},
		];
	}, [buttonRenderContext.namespace, toolbarItem]);
	const outputProps = useMemo<PropsOutput[]>(() => {
		if (!isOutputRefControl(toolbarItem)) return [];
		const p = toolbarItem.props;
		return [
			{
				namespace: p.sessionId ?? buttonRenderContext.namespace,
				outputId: p.name,
				overrides: p.overrides,
			},
		];
	}, [buttonRenderContext.namespace, toolbarItem]);
	const exports = useExports(exportProps);
	const opened = popoverId ? openedPopoverId === popoverId : localOpened;
	const actionDisabled =
		buttonRenderContext.buttonsDisabled ||
		buttonRenderContext.executing ||
		buttonRenderContext.hasPendingChanges;
	const triggerIconType = getTriggerIconType(
		toolbarItem.icon ??
			(isActionRefControl(toolbarItem)
				? toolbarItem.props.icon
				: undefined) ??
			defaultIcon,
		label,
	);

	const setOpened = useCallback(
		(next: boolean | ((current: boolean) => boolean)) => {
			const value = typeof next === "function" ? next(opened) : next;

			if (!value && hasActiveInteractionRequest) return;

			if (popoverId && onPopoverOpenChange) {
				onPopoverOpenChange(popoverId, value);
				return;
			}

			setLocalOpened(value);
		},
		[hasActiveInteractionRequest, onPopoverOpenChange, opened, popoverId],
	);

	const renderTriggerButton = useCallback(
		(
			onClick?: React.MouseEventHandler<HTMLButtonElement>,
			loading?: boolean,
			tooltipLabel?: string,
			disabled?: boolean,
		) => (
			<AppBuilderToolbarIconButton
				label={label}
				tooltipLabel={tooltipLabel ?? tooltip}
				iconType={triggerIconType}
				loading={loading}
				disabled={disabled}
				onClick={onClick}
				{...buttonThemeProps}
			/>
		),
		[buttonThemeProps, label, tooltip, triggerIconType],
	);

	if (isActionRefControl(toolbarItem)) {
		const actionKey = String(
			("id" in toolbarItem ? toolbarItem.id : undefined) ??
				`toolbar-action-${toolbarItem.props.definition.type}`,
		);
		return AppBuilderActionFromType(
			getToolbarActionRef({...toolbarItem, type: "action"}),
			buttonRenderContext.namespace,
			actionKey,
			componentContext,
			{
				presentation: "toolbarIcon",
				toolbarButtonProps: buttonThemeProps,
				viewportId: buttonRenderContext.viewportId,
				fullscreenId: buttonRenderContext.fullscreenId,
				disabled: actionDisabled,
			},
		);
	}

	if (isExportRefControl(toolbarItem)) {
		return (
			<AppBuilderExportToolbarButton
				exportData={exports[0]}
				label={label}
				tooltip={tooltip}
				iconType={triggerIconType}
				buttonThemeProps={buttonThemeProps}
				disabled={actionDisabled}
			/>
		);
	}

	const hasPopoverContent =
		(isToolbarActionMenuItem(toolbarItem) &&
			toolbarItem.props.sections.length > 0) ||
		(isToolbarWidgetPanelItem(toolbarItem) &&
			toolbarItem.props.widgets.length > 0) ||
		(isToolbarTabbedPanelItem(toolbarItem) &&
			toolbarItem.props.tabs.length > 0) ||
		(isParameterRefControl(toolbarItem) && parameterProps.length > 0) ||
		isOutputRefControl(toolbarItem);
	const fixedWidthPopover =
		isToolbarWidgetPanelItem(toolbarItem) ||
		isToolbarTabbedPanelItem(toolbarItem);

	if (!hasPopoverContent) {
		return renderTriggerButton();
	}

	// Action menu items can open a Mantine `Modal` (e.g. "Import model state").
	// The popover has `closeOnClickOutside={false}`, so the menu stays open
	// after an action is clicked. We close it on action click (see
	// `onActionActivate` in AppBuilderToolbarPopoverContent). Closing the
	// popover would normally unmount the action component that owns the modal
	// state, killing the modal. `keepMounted` keeps the dropdown content
	// mounted (hidden) while closed, so the action component — and its
	// modal — survive. Use `display-none` (not the default `activity`): React
	// 19 `Activity` hidden pauses the subtree, which would freeze the modal's
	// state updates (e.g. Cancel would no longer close it).
	const actionMenuKeepMounted = isToolbarActionMenuItem(toolbarItem)
		? {keepMounted: true, keepMountedMode: "display-none" as const}
		: {};

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
					{opened
						? renderTriggerButton(
								() => setOpened((current) => !current),
								undefined,
								"",
							)
						: renderTriggerButton(() =>
								setOpened((current) => !current),
							)}
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
					toolbarItem={toolbarItem}
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
