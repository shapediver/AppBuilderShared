import {IAppBuilderTab} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	APP_BUILDER_UI_EVENTS,
	pickAllowedActionSlots,
	uiSlotDomProps,
	type AppBuilderUiSlotHandlers,
} from "@AppBuilderLib/features/appbuilder/lib/appBuilderActionSlots";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import AppBuilderActionSlots from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionSlots";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderLib/shared/ui/tabs/TabsComponent";
import AppBuilderWidgetsWithStackShell from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell";
import {useMemo, useRef} from "react";

interface Props {
	/**
	 * Default session namespace to use for parameter and export references that do
	 * not specify a session namespace.
	 */
	namespace: string;
	/** The tabs to display. */
	tabs: IAppBuilderTab[] | undefined;
	/** Optional name of the container. */
	containerName?: string;
	stickyTabs?: boolean;
}

export default function AppBuilderTabsComponent({
	namespace,
	tabs,
	containerName,
	stickyTabs = true,
}: Props) {
	const {setActiveTab} = useShapeDiverStoreStandardContainers();
	const tabHandlerRefs = useRef<AppBuilderUiSlotHandlers[]>([]);

	const tabProps: ITabsComponentProps | null = useMemo(() => {
		if (!tabs || tabs.length === 0) {
			return null;
		}

		return {
			defaultValue: tabs[0].name,
			stickyTabs,
			tabs: tabs.map((tab, index) => {
				if (!tabHandlerRefs.current[index]) {
					tabHandlerRefs.current[index] = {};
				}
				const handlers = tabHandlerRefs.current[index];
				// Mantine requires Tabs.Tab as a direct Tabs.List child, so UI
				// listeners live on controlProps instead of a wrap Box.
				const enabledEvents = new Set(
					pickAllowedActionSlots(
						tab.actionSlots,
						APP_BUILDER_UI_EVENTS,
					).map((item) => item.eventName),
				);
				return {
					name: tab.name,
					icon: tab.icon,
					tooltip: tab.tooltip,
					controlProps: uiSlotDomProps(
						(eventName) => handlers[eventName]?.(),
						enabledEvents,
					),
					children: [
						<AppBuilderWidgetsWithStackShell
							key={0}
							namespace={namespace}
							widgets={tab.widgets}
						/>,
					],
				};
			}),
			onActiveTabChange: containerName
				? (tabIndex: number) => setActiveTab(containerName, tabIndex)
				: undefined,
		};
	}, [namespace, tabs, containerName, setActiveTab, stickyTabs]);

	if (!tabProps) {
		return <></>;
	}

	return (
		<>
			{tabs?.map((tab, index) => {
				if (!tabHandlerRefs.current[index]) {
					tabHandlerRefs.current[index] = {};
				}
				return (
					<AppBuilderActionSlots
						key={`action-slots-${tab.name}-${index}`}
						actionSlots={tab.actionSlots}
						namespace={namespace}
						handlersRef={{current: tabHandlerRefs.current[index]}}
					/>
				);
			})}
			<TabsComponent {...tabProps} />
		</>
	);
}
