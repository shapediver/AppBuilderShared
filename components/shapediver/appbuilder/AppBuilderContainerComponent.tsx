import AppBuilderTabsComponent from "@AppBuilderShared/components/shapediver/appbuilder/AppBuilderTabsComponent";
import AppBuilderWidgetsComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderWidgetsComponent";
import {AppBuilderStackContext} from "@AppBuilderShared/context/StackContext";
import {IAppBuilderStackContextElement} from "@AppBuilderShared/types/context/stackcontext";
import {IAppBuilderContainer} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useCallback} from "react";
import AppBuilderStackUiWidgetComponent from "~/shared/components/shapediver/appbuilder/widgets/AppBuilderStackUiWidget/AppBuilderStackUiWidgetComponent";

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
	const [stackElements, setStackElements] = React.useState<
		IAppBuilderStackContextElement[]
	>([]);

	const push = useCallback((element: IAppBuilderStackContextElement) => {
		setStackElements((prev) => [...prev, element]);
	}, []);

	const pop = useCallback(() => {
		setStackElements((prev) => prev.slice(0, -1));
	}, []);
	const currentStackElement = stackElements[stackElements.length - 1];

	return (
		<>
			<AppBuilderStackContext.Provider value={{push, pop}}>
				<AppBuilderTabsComponent namespace={namespace} tabs={tabs} />
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
