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

export default function AppBuilderWidgetsWithStackShell({
	namespace,
	widgets,
	fallbackScrolls = false,
}: Props) {
	const {stackPath, context} = useStackContext(300);

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
