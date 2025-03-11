import AppBuilderTabsComponent from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderTabsComponent";
import AppBuilderWidgetsComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderWidgetsComponent";
import {IAppBuilderContainer} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";

interface Props extends IAppBuilderContainer {
	/**
	 * Default session namespace to use for parameter and export references that do
	 * not specify a session namespace.
	 */
	namespace: string;
}

export default function AppBuilderContainerComponent({
	namespace,
	widgets,
	tabs,
}: Props) {
	return (
		<>
			<AppBuilderTabsComponent namespace={namespace} tabs={tabs} />
			<AppBuilderWidgetsComponent
				namespace={namespace}
				widgets={widgets}
			/>
		</>
	);
}
