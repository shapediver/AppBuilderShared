import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {useOutputs} from "@AppBuilderLib/entities/output/model/useOutputs";
import OutputStargateComponent from "@AppBuilderLib/entities/output/ui/OutputStargateComponent";
import {PropsParameter} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {useParameters} from "@AppBuilderLib/entities/parameter/model/useParameters";
import {
	IAppBuilderToolbarItem,
	isOutputRefControl,
	isParameterRefControl,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {getParameterComponent} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import AppBuilderTabsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderTabsComponent";
import AppBuilderWidgetsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsComponent";
import {Divider, Paper, Stack} from "@mantine/core";
import React, {useMemo} from "react";
import {AppBuilderActionFromType} from "./AppBuilderActionFromType";
import {
	getToolbarActionRef,
	normalizeMenuItemGroups,
} from "./appBuilderToolbarButtonShared";

type Props = {
	toolbarItem: IAppBuilderToolbarItem;
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
};

/**
 * Resolves the content shown inside a toolbar popover.
 * This keeps AppBuilderToolbarButton focused on trigger/open-state logic.
 */
export default function AppBuilderToolbarPopoverContent({
	toolbarItem,
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
}: Props) {
	const parameters = useParameters(parameterProps);
	const outputs = useOutputs(outputProps);
	const menuItems = "items" in toolbarItem ? toolbarItem.items : undefined;

	return useMemo(() => {
		if (menuItems && menuItems.length > 0) {
			const groups = normalizeMenuItemGroups(menuItems)
				.map((group, groupIndex) => ({
					useItemSpacing: group.every(
						(item) => item.presentation === "item",
					),
					nodes: group
						.map((item, index) => {
							if (
								item.type !== "action" ||
								!item.props?.definition
							) {
								return null;
							}

							const key =
								item.id ??
								`${groupIndex}-${item.props.definition.type}-${index}`;
							const actionRef = getToolbarActionRef(item);

							const actionEl = AppBuilderActionFromType(
								actionRef,
								namespace,
								`toolbar-menu-action-${key}`,
								componentContext,
								{
									presentation:
										item.presentation === "item"
											? "item"
											: "button",
									viewportId,
									fullscreenId,
									disabled: actionDisabled,
								},
							);

							return actionEl ? (
								<React.Fragment key={key}>
									{actionEl}
								</React.Fragment>
							) : null;
						})
						.filter(Boolean),
				}))
				.filter((group) => group.nodes.length > 0);

			if (groups.length === 0) return null;
			return (
				<Stack {...menuStackProps}>
					{groups.map((group, index) => (
						<React.Fragment key={index}>
							{index > 0 && <Divider {...menuDividerProps} />}
							<Stack
								{...menuSectionStackProps}
								gap={
									menuSectionStackProps.gap ??
									(group.useItemSpacing ? 0 : "xs")
								}
							>
								{group.nodes}
							</Stack>
						</React.Fragment>
					))}
				</Stack>
			);
		}

		if ("widgets" in toolbarItem) {
			return (
				<AppBuilderWidgetsComponent
					namespace={namespace}
					widgets={toolbarItem.widgets}
				/>
			);
		}

		if ("tabs" in toolbarItem) {
			return (
				<AppBuilderTabsComponent
					namespace={namespace}
					tabs={toolbarItem.tabs}
					stickyTabs={toolbarItem.stickyTabs}
				/>
			);
		}

		if (!("type" in toolbarItem)) return null;

		if (isParameterRefControl(toolbarItem)) {
			const parameter = parameters[0];
			if (!parameter || parameter.definition.hidden) return null;
			const {component: ParameterComponent, extraBottomPadding} =
				getParameterComponent(componentContext, parameter.definition);
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

		if (isOutputRefControl(toolbarItem)) {
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

		return null;
	}, [
		actionDisabled,
		componentContext,
		fullscreenId,
		menuDividerProps,
		menuItems,
		menuSectionStackProps,
		menuStackProps,
		namespace,
		outputProps,
		outputs,
		parameterProps,
		parameters,
		toolbarItem,
		viewportId,
	]);
}
