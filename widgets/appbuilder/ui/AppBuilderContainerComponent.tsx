import {
	IAppBuilderAnchor2dContainer,
	IAppBuilderAnchor3dContainer,
	IAppBuilderStandardContainer,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import AppBuilderActionSlots from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionSlots";
import AppBuilderWidgetsWithStackShell from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell";
import AppBuilderTabsComponent from "./AppBuilderTabsComponent";

type Props = (
	| IAppBuilderStandardContainer
	| IAppBuilderAnchor2dContainer
	| IAppBuilderAnchor3dContainer
) & {
	/**
	 * Default session namespace to use for parameter and export references that do
	 * not specify a session namespace.
	 */
	namespace: string;
};

export default function AppBuilderContainerComponent({
	namespace,
	widgets,
	tabs,
	name,
	actionSlots,
}: Props) {
	const hasTabs = Boolean(tabs?.length);
	// No tabs: always mount (legacy). With tabs: only if container.widgets non-empty
	// (tab widgets get their own shell in AppBuilderTabsComponent — SS-9879).
	const showContainerWidgets = !hasTabs || Boolean(widgets?.length);

	// Default UI allowlist (pointer/`click`) on the container node.
	return (
		<AppBuilderActionSlots actionSlots={actionSlots} namespace={namespace}>
			<AppBuilderTabsComponent
				namespace={namespace}
				tabs={tabs}
				containerName={name}
			/>
			{showContainerWidgets && (
				<AppBuilderWidgetsWithStackShell
					namespace={namespace}
					widgets={widgets}
				/>
			)}
		</AppBuilderActionSlots>
	);
}
