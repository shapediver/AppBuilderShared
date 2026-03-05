import {AppBuilderStackContext} from "@AppBuilderLib/features/appbuilder/lib/StackContext";
import AppBuilderTabsComponent from "./AppBuilderTabsComponent";
import AppBuilderWidgetsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsComponent";
import {IAppBuilderContainer} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import React from "react";
import AppBuilderStackUiWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderStackUiWidget/AppBuilderStackUiWidgetComponent";
import {useStackContext} from "@AppBuilderLib/features/appbuilder/model/useStackContext";

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
	const {
		push,
		pop,
		animationDuration,
		isTransitioning,
		setIsTransitioning,
		currentStackElement,
	} = useStackContext(300);

	return (
		<>
			<AppBuilderStackContext.Provider
				value={{
					push,
					pop,
					animationDuration,
					isTransitioning,
					setIsTransitioning,
				}}
			>
				<AppBuilderTabsComponent
					namespace={namespace}
					tabs={tabs}
					containerName={name}
				/>
				<AppBuilderStackUiWidgetComponent
					namespace={namespace}
					stackElement={currentStackElement}
				>
					<AppBuilderWidgetsComponent
						namespace={namespace}
						widgets={widgets}
					/>
				</AppBuilderStackUiWidgetComponent>
			</AppBuilderStackContext.Provider>
		</>
	);
}
