import AppBuilderWidgetsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsComponent";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderLib/shared/ui/tabs/TabsComponent";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {IAppBuilderTab} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import React, {useMemo} from "react";

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
}

export default function AppBuilderTabsComponent({
	namespace,
	tabs,
	containerName,
}: Props) {
	const {setActiveTab} = useShapeDiverStoreStandardContainers();

	if (!tabs || tabs.length === 0) {
		return <></>;
	}

	const tabProps: ITabsComponentProps = useMemo(() => {
		return {
			defaultValue: tabs[0].name,
			stickyTabs: true,
			tabs: tabs.map((tab) => {
				return {
					name: tab.name,
					icon: tab.icon,
					tooltip: tab.tooltip,
					children: [
						<AppBuilderWidgetsComponent
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
	}, [namespace, tabs]);

	return <TabsComponent {...tabProps} />;
}
