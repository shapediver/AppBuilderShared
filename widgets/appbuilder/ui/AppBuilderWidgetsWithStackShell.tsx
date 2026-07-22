import {IAppBuilderWidget} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderStackContext} from "@AppBuilderLib/features/appbuilder/lib/StackContext";
import {useStackContext} from "@AppBuilderLib/features/appbuilder/model/useStackContext";
import AppBuilderStackUiWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderStackUiWidget/AppBuilderStackUiWidgetComponent";
import AppBuilderWidgetsComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsComponent";

interface Props {
	namespace: string;
	widgets: IAppBuilderWidget[] | undefined;
	fallbackScrolls?: boolean;
}

/**
 * Per-scope stack shell: own `useStackContext` + Provider + slide shell around a widget list.
 * Used for container-level widgets and for each tab panel so stackUi resolves the correct `liveWidgets` (SS-9879).
 */
export default function AppBuilderWidgetsWithStackShell({
	namespace,
	widgets,
	fallbackScrolls = false,
}: Props) {
	const {stackPath, context} = useStackContext();

	return (
		<AppBuilderStackContext.Provider value={context}>
			<AppBuilderStackUiWidgetComponent
				namespace={namespace}
				stackPath={stackPath}
				liveWidgets={widgets}
				fallbackScrolls={fallbackScrolls}
			>
				<AppBuilderWidgetsComponent
					namespace={namespace}
					widgets={widgets}
				/>
			</AppBuilderStackUiWidgetComponent>
		</AppBuilderStackContext.Provider>
	);
}
