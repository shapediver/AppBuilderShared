import {
	isAccordionUiWidget,
	isHostedAgentWidget,
	isStackUiWidget,
	isToolbarContainer,
	type AppBuilderStandardContainerNameType,
	type IAppBuilder,
	type IAppBuilderTab,
	type IAppBuilderWidget,
	type IAppBuilderWidgetPropsHostedAgent,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderStandardContainerNames} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreStandardContainers";
import {
	isToolbarTabbedPanelItem,
	isToolbarWidgetPanelItem,
} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {Logger} from "@AppBuilderLib/shared/lib/logger";

function collectFromWidgets(
	widgets: IAppBuilderWidget[] | undefined,
): IAppBuilderWidgetPropsHostedAgent[] {
	const collected: IAppBuilderWidgetPropsHostedAgent[] = [];
	for (const widget of widgets ?? []) {
		if (isHostedAgentWidget(widget)) {
			collected.push(widget.props);
		}
		if (isStackUiWidget(widget)) {
			collected.push(...collectFromWidgets(widget.props.widgets));
		}
		if (isAccordionUiWidget(widget)) {
			for (const item of widget.props.items) {
				collected.push(...collectFromWidgets(item.widgets));
			}
		}
	}
	return collected;
}

function collectFromTabs(
	tabs: IAppBuilderTab[] | undefined,
	activeTabIndex?: number,
): IAppBuilderWidgetPropsHostedAgent[] {
	if (!tabs?.length) {
		return [];
	}
	if (activeTabIndex === undefined) {
		return tabs.flatMap((tab) => collectFromWidgets(tab.widgets));
	}
	const index = Math.min(Math.max(activeTabIndex, 0), tabs.length - 1);
	return collectFromWidgets(tabs[index].widgets);
}

function isStandardContainerName(
	name: string,
): name is AppBuilderStandardContainerNameType {
	return (AppBuilderStandardContainerNames as readonly string[]).includes(
		name,
	);
}

/** Which standard-container tabs are on screen. Idle tabs are omitted. */
export type HostedAgentActiveContext = {
	activeTabIndices?: Partial<
		Record<AppBuilderStandardContainerNameType, number>
	>;
	containerOpen?: Partial<
		Record<AppBuilderStandardContainerNameType, boolean>
	>;
};

function collectFromLayout(
	appBuilder: IAppBuilder,
	context?: HostedAgentActiveContext,
): IAppBuilderWidgetPropsHostedAgent[] {
	const collected: IAppBuilderWidgetPropsHostedAgent[] = [];
	const activeOnly = context !== undefined;
	for (const container of appBuilder.containers) {
		if (isToolbarContainer(container)) {
			for (const group of container.groups ?? []) {
				for (const item of group) {
					if (isToolbarWidgetPanelItem(item)) {
						collected.push(
							...collectFromWidgets(item.props.widgets),
						);
					}
					if (isToolbarTabbedPanelItem(item)) {
						collected.push(
							...collectFromTabs(
								item.props.tabs,
								activeOnly ? 0 : undefined,
							),
						);
					}
				}
			}
			continue;
		}
		if (isStandardContainerName(container.name)) {
			if (
				activeOnly &&
				context.containerOpen?.[container.name] === false
			) {
				continue;
			}
			collected.push(...collectFromWidgets(container.widgets));
			collected.push(
				...collectFromTabs(
					container.tabs,
					activeOnly
						? (context.activeTabIndices?.[container.name] ?? 0)
						: undefined,
				),
			);
			continue;
		}
		collected.push(...collectFromWidgets(container.widgets));
		collected.push(
			...collectFromTabs(container.tabs, activeOnly ? 0 : undefined),
		);
	}
	return collected;
}

/** Placed `hostedAgent` widgets in tree order, including idle tabs. */
export function collectPlacedHostedAgentWidgets(
	appBuilder: IAppBuilder | undefined,
): IAppBuilderWidgetPropsHostedAgent[] {
	if (!appBuilder) {
		return [];
	}
	return collectFromLayout(appBuilder);
}

/** Placed `hostedAgent` widgets that are on the active tab / open container. */
export function collectActiveHostedAgentWidgets(
	appBuilder: IAppBuilder | undefined,
	context: HostedAgentActiveContext = {},
): IAppBuilderWidgetPropsHostedAgent[] {
	if (!appBuilder) {
		return [];
	}
	return collectFromLayout(appBuilder, context);
}

/**
 * True when App Builder JSON already embeds a hosted agent widget.
 * The floating toolbar must not duplicate that frame.
 */
export function hasPlacedHostedAgentWidget(
	appBuilder: IAppBuilder | undefined,
): boolean {
	return collectPlacedHostedAgentWidgets(appBuilder).length > 0;
}

/** Warns when more than one *active* `hostedAgent` widget is placed. */
export function warnDuplicateHostedAgentWidgets(
	appBuilder: IAppBuilder | undefined,
	context: HostedAgentActiveContext = {},
): void {
	const widgets = collectActiveHostedAgentWidgets(appBuilder, context);
	if (widgets.length < 2) {
		return;
	}
	Logger.warn(
		"Multiple hostedAgent widgets are active; only one ToolsApi peer is connected.",
	);
}
