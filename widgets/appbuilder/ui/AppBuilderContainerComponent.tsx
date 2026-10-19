import {
	AppBuilderContainerNameType,
	IAppBuilderAnchor2dContainer,
	IAppBuilderAnchor3dContainer,
	IAppBuilderStandardContainer,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {APP_BUILDER_SLOT_EVENTS} from "@AppBuilderLib/features/appbuilder/lib/appBuilderActionSlots";
import {appBuilderPanelSpacing} from "@AppBuilderLib/features/appbuilder/lib/appBuilderPanelSpacing";
import AppBuilderActionSlots from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionSlots";
import ThemeProvider from "@AppBuilderLib/shared/ui/theme/ThemeProvider";
import {AppBuilderControlsWidgetComponentThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderControlsWidgetComponent";
import AppBuilderWidgetsWithStackShell from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsWithStackShell";
import {AppBuilderHorizontalContainerThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderHorizontalContainer";
import {AppBuilderVerticalContainerThemeProps} from "@AppBuilderShared/pages/templates/AppBuilderVerticalContainer";
import AppBuilderTabsComponent from "./AppBuilderTabsComponent";

/**
 * Anchor cards use the same spacing as toolbar panels. The container gap
 * and the controls-widget gap are scoped here so sidebar containers keep
 * the theme Stack gap.
 */
const anchorPanelTheme = {
	components: {
		AppBuilderVerticalContainer: AppBuilderVerticalContainerThemeProps({
			gap: appBuilderPanelSpacing,
		}),
		AppBuilderHorizontalContainer: AppBuilderHorizontalContainerThemeProps({
			gap: appBuilderPanelSpacing,
		}),
		AppBuilderControlsWidgetComponent:
			AppBuilderControlsWidgetComponentThemeProps({
				stackProps: {gap: appBuilderPanelSpacing},
			}),
		TabsPanel: {defaultProps: {pt: appBuilderPanelSpacing}},
	},
};

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

	const content = (
		<AppBuilderActionSlots
			actionSlots={actionSlots}
			allowedEvents={APP_BUILDER_SLOT_EVENTS.container}
			namespace={namespace}
		>
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

	if (
		name === AppBuilderContainerNameType.Anchor2d ||
		name === AppBuilderContainerNameType.Anchor3d
	) {
		return (
			<ThemeProvider theme={anchorPanelTheme}>{content}</ThemeProvider>
		);
	}

	return content;
}
