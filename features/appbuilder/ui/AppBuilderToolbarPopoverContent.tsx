import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {useOutputs} from "@AppBuilderLib/entities/output/model/useOutputs";
import OutputStargateComponent from "@AppBuilderLib/entities/output/ui/OutputStargateComponent";
import {PropsParameter} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {useParameters} from "@AppBuilderLib/entities/parameter/model/useParameters";
import {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {getParameterComponent} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import type {ToolbarPopoverItem} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import AppBuilderTabsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderTabsComponent";
import AppBuilderWidgetsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsComponent";
import {Divider, Paper, Stack, Text} from "@mantine/core";
import React, {useMemo} from "react";
import {AppBuilderActionFromType} from "./AppBuilderActionFromType";
import AppBuilderToolbarCommandButton from "./AppBuilderToolbarCommandButton";
import AppBuilderToolbarMenuCheckbox from "./AppBuilderToolbarMenuCheckbox";

type Props = {
	item: ToolbarPopoverItem;
	componentContext: IComponentContext;
	namespace: string;
	viewportId?: string;
	fullscreenId: string;
	actionDisabled: boolean;
	parameterProps: PropsParameter[];
	outputProps: PropsOutput[];
	menuStackProps: React.ComponentProps<typeof Stack>;
	menuSectionStackProps: React.ComponentProps<typeof Stack>;
	menuDividerProps: React.ComponentProps<typeof Divider>;
	/**
	 * Called when a toolbar menu action is activated (clicked). Used by the
	 * toolbar button to close the popover after an action runs, so the menu
	 * does not stay open over a modal the action may have opened.
	 */
	onActionActivate?: () => void;
};

/** Renders the resolved popover representation for a toolbar item. */
export default function AppBuilderToolbarPopoverContent({
	item,
	componentContext,
	namespace,
	viewportId,
	fullscreenId,
	actionDisabled,
	parameterProps,
	outputProps,
	menuStackProps,
	menuSectionStackProps,
	menuDividerProps,
	onActionActivate,
}: Props) {
	const parameters = useParameters(parameterProps);
	const outputs = useOutputs(outputProps);

	return useMemo(() => {
		switch (item.type) {
			case "menu":
				return (
					<Stack {...menuStackProps}>
						{item.props.sections.map((section, sectionIndex) => {
							const configuredActions = section.items.filter(
								(menuItem) => menuItem.type === "action",
							);
							const useItemSpacing =
								configuredActions.length > 0 &&
								configuredActions.every(
									(menuItem) =>
										menuItem.presentation === "item",
								);
							return (
								<React.Fragment key={section.id}>
									{sectionIndex > 0 && (
										<Divider {...menuDividerProps} />
									)}
									<Stack
										{...menuSectionStackProps}
										gap={
											menuSectionStackProps.gap ??
											(configuredActions.length === 0 ||
											useItemSpacing
												? 0
												: "xs")
										}
									>
										{section.items.map((menuItem) => {
											if (menuItem.type === "checkbox") {
												return (
													<AppBuilderToolbarMenuCheckbox
														key={menuItem.id}
														label={menuItem.label}
														checked={
															menuItem.props
																.checked
														}
														readOnly={
															menuItem.props
																.readOnly
														}
														disabled={
															menuItem.disabled
														}
														trailingAction={
															menuItem.props
																.trailingAction
														}
														onChange={() =>
															menuItem.props.setChecked(
																!menuItem.props
																	.checked,
															)
														}
													/>
												);
											}
											if (menuItem.type === "command") {
												return (
													<AppBuilderToolbarCommandButton
														key={menuItem.id}
														item={menuItem}
														presentation="menu"
													/>
												);
											}

											const action =
												AppBuilderActionFromType(
													menuItem.props,
													namespace,
													`toolbar-menu-action-${menuItem.id}`,
													componentContext,
													{
														presentation:
															menuItem.presentation ??
															"button",
														viewportId,
														fullscreenId,
														disabled:
															actionDisabled ||
															menuItem.disabled,
													},
												);
											return action ? (
												<React.Fragment
													key={menuItem.id}
												>
													<span
														onClick={
															onActionActivate
														}
													>
														{action}
													</span>
												</React.Fragment>
											) : null;
										})}
									</Stack>
								</React.Fragment>
							);
						})}
					</Stack>
				);
			case "widgets": {
				const widgets = (
					<AppBuilderWidgetsComponent
						namespace={namespace}
						widgets={item.props.widgets}
					/>
				);
				if (!item.label) return widgets;
				return (
					<Stack gap="xs">
						<Text size="sm" fw={600}>
							{item.label}
						</Text>
						{widgets}
					</Stack>
				);
			}
			case "tabs":
				return (
					<AppBuilderTabsComponent
						namespace={namespace}
						tabs={item.props.tabs}
						stickyTabs={item.props.stickyTabs}
					/>
				);
			case "parameter": {
				const parameter = parameters[0];
				if (!parameter || parameter.definition.hidden) return null;
				const {component: ParameterComponent, extraBottomPadding} =
					getParameterComponent(
						componentContext,
						parameter.definition,
					);
				return (
					<ParameterComponent
						{...parameterProps[0]}
						wrapperComponent={Paper}
						wrapperProps={{
							shadow: "none",
							withBorder: false,
							p: 0,
							pb: extraBottomPadding ? "md" : undefined,
						}}
						disableIfDirty={
							parameterProps[0].disableIfDirty ??
							!parameterProps[0].acceptRejectMode
						}
					/>
				);
			}
			case "output": {
				const output = outputs[0];
				if (!output || output.definition.hidden) return null;
				return (
					<Paper shadow="none" withBorder={false} p={0}>
						<OutputStargateComponent
							{...outputProps[0]}
							namespace={outputProps[0].namespace}
						/>
					</Paper>
				);
			}
		}
	}, [
		actionDisabled,
		componentContext,
		fullscreenId,
		item,
		menuDividerProps,
		menuSectionStackProps,
		menuStackProps,
		namespace,
		onActionActivate,
		outputProps,
		outputs,
		parameterProps,
		parameters,
		viewportId,
	]);
}
