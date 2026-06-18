import {IAppBuilderContainer} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderStackContext} from "@AppBuilderLib/features/appbuilder/lib/StackContext";
import {useStackContext} from "@AppBuilderLib/features/appbuilder/model/useStackContext";
import AppBuilderStackUiWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderStackUiWidget/AppBuilderStackUiWidgetComponent";
import AppBuilderWidgetsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsComponent";
import React from "react";
import AppBuilderTabsComponent from "./AppBuilderTabsComponent";

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
	name,
}: Props) {
	const {stackPath, context} = useStackContext(300);

	return (
		<AppBuilderStackContext.Provider value={context}>
			<AppBuilderTabsComponent
				namespace={namespace}
				tabs={tabs}
				containerName={name}
			/>
			<AppBuilderStackUiWidgetComponent
				namespace={namespace}
				stackPath={stackPath}
				liveWidgets={widgets}
			>
				<AppBuilderWidgetsComponent
					namespace={namespace}
					widgets={widgets}
				/>
			</AppBuilderStackUiWidgetComponent>
		</AppBuilderStackContext.Provider>
	);
}
