import {
	isAccordionUiWidget,
	isHostedAgentWidget,
	isStackUiWidget,
	isToolbarContainer,
	type IAppBuilder,
	type IAppBuilderWidget,
	type IAppBuilderWidgetPropsHostedAgent,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
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

/** Placed `hostedAgent` widgets in tree order. */
export function collectPlacedHostedAgentWidgets(
	appBuilder: IAppBuilder | undefined,
): IAppBuilderWidgetPropsHostedAgent[] {
	if (!appBuilder) {
		return [];
	}
	const collected: IAppBuilderWidgetPropsHostedAgent[] = [];
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
						for (const tab of item.props.tabs) {
							collected.push(
								...collectFromWidgets(tab.widgets),
							);
						}
					}
				}
			}
			continue;
		}
		collected.push(...collectFromWidgets(container.widgets));
		for (const tab of container.tabs ?? []) {
			collected.push(...collectFromWidgets(tab.widgets));
		}
	}
	return collected;
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

/** First placed widget's `agentId`, if set. */
export function placedHostedAgentId(
	appBuilder: IAppBuilder | undefined,
): string | undefined {
	const agentId =
		collectPlacedHostedAgentWidgets(appBuilder)[0]?.agentId?.trim();
	return agentId ? agentId : undefined;
}

function resolvedHostedAgentKey(
	agentId: string | undefined,
	defaultAgentId: string | undefined,
): string {
	const id = agentId?.trim();
	if (id) {
		return id;
	}
	return defaultAgentId ?? "";
}

/** Warns when more than one placed `hostedAgent` widget targets the same agent. */
export function warnDuplicateHostedAgentWidgets(
	appBuilder: IAppBuilder | undefined,
): void {
	const widgets = collectPlacedHostedAgentWidgets(appBuilder);
	if (widgets.length < 2) {
		return;
	}
	const defaultAgentId = appBuilder?.agents?.[0]?.id;
	const counts = new Map<string, number>();
	for (const widget of widgets) {
		const key = resolvedHostedAgentKey(widget.agentId, defaultAgentId);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	for (const [id, count] of counts) {
		if (count < 2) {
			continue;
		}
		Logger.warn(
			id
				? `Multiple hostedAgent widgets target agent "${id}".`
				: "Multiple hostedAgent widgets target the default agent.",
		);
	}
}
