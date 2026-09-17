import {IAppBuilderTab} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	APP_BUILDER_SLOT_EVENTS,
	pickAllowedActionSlots,
	uiSlotDomProps,
	type AppBuilderUiSlotHandlers,
} from "@AppBuilderLib/features/appbuilder/lib/appBuilderActionSlots";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import AppBuilderActionSlots from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionSlots";
import {AppBuilderCustomEventProvider} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderCustomEventContext";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderLib/shared/ui/tabs/TabsComponent";
import AppBuilderWidgetsWithStackShell from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell";
import {MutableRefObject, useMemo, useRef} from "react";

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

function tabHandlersRef(
	refs: MutableRefObject<Array<MutableRefObject<AppBuilderUiSlotHandlers>>>,
	index: number,
): MutableRefObject<AppBuilderUiSlotHandlers> {
	if (!refs.current[index]) {
		refs.current[index] = {current: {}};
	}
	return refs.current[index];
}

export default function AppBuilderTabsComponent({
	namespace,
	tabs,
	containerName,
	stickyTabs = true,
}: Props) {
	const {setActiveTab} = useShapeDiverStoreStandardContainers();
	const tabHandlerRefs = useRef<
		Array<MutableRefObject<AppBuilderUiSlotHandlers>>
	>([]);

	const tabProps: ITabsComponentProps | null = useMemo(() => {
		if (!tabs || tabs.length === 0) {
			return null;
		}

		return {
			defaultValue: tabs[0].name,
			stickyTabs,
			tabs: tabs.map((tab, index) => {
				const handlersRef = tabHandlersRef(tabHandlerRefs, index);
				const resolved = pickAllowedActionSlots(
					tab.actionSlots,
					APP_BUILDER_SLOT_EVENTS.tab,
				);
				// Mantine requires Tabs.Tab as a direct Tabs.List child, so UI
				// listeners live on controlProps instead of a wrap Box.
				const enabledEvents = new Set(
					resolved.map((item) => item.eventName),
				);
				return {
					name: tab.name,
					icon: tab.icon,
					tooltip: tab.tooltip,
					controlProps: uiSlotDomProps(
						(eventName) => handlersRef.current[eventName]?.(),
						enabledEvents,
					),
					children: [
						<AppBuilderCustomEventProvider
							key={0}
							namespace={namespace}
							resolved={resolved}
							handlersRef={handlersRef}
						>
							<AppBuilderWidgetsWithStackShell
								namespace={namespace}
								widgets={tab.widgets}
							/>
						</AppBuilderCustomEventProvider>,
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
			{tabs?.map((tab, index) => (
				<AppBuilderActionSlots
					key={`action-slots-${tab.name}-${index}`}
					actionSlots={tab.actionSlots}
					allowedEvents={APP_BUILDER_SLOT_EVENTS.tab}
					namespace={namespace}
					handlersRef={tabHandlersRef(tabHandlerRefs, index)}
				/>
			))}
			<TabsComponent {...tabProps} />
		</>
	);
}
