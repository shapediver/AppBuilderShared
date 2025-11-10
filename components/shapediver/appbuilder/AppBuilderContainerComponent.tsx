import AppBuilderTabsComponent from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderTabsComponent";
import AppBuilderWidgetsComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderWidgetsComponent";
import {AppBuilderStackContext} from "@AppBuilderShared/context/StackContext";
import {IAppBuilderContainer} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";
import AppBuilderStackUiWidgetComponent from "~/shared/components/shapediver/appbuilder/widgets/AppBuilderStackUiWidget/AppBuilderStackUiWidgetComponent";
import {useStackContext} from "~/shared/hooks/context/useStackContext";

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
