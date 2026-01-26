import {useShapeDiverStoreStargate} from "@AppBuilderLib/entities/stargate/model/useShapeDiverStoreStargate";
import DesktopClientPanel from "@AppBuilderLib/entities/stargate/ui/DesktopClientPanel";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {ComponentContext} from "@AppBuilderShared/context/ComponentContext";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {
	AttributeVisualizationVisibility,
	IAppBuilderSettingsSession,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useContext, useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import AppBuilderSavedStatesWidgetComponent from "./widgets/AppBuilderSavedStatesWidgetComponent";

interface Props {
	parameters: PropsParameter[];
	exports: PropsExport[];
	outputs: PropsOutput[];
	namespace?: string;
	settings?: IAppBuilderSettingsSession;
}

export default function AppBuilderFallbackContainerComponent({
	parameters,
	exports,
	outputs,
	namespace,
	settings,
}: Props) {
	const showDesktopClientPanel = useShapeDiverStoreStargate(
		useShallow((state) => state.referenceCount > 0),
	);
	const {sessionApi} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessionApi: namespace ? state.sessions[namespace] : undefined,
		})),
	);

	const componentContext = useContext(ComponentContext);

	// get the attribute visualization widget component from the component context
	// if one is registered
	const AppBuilderAttributeVisualizationWidgetComponent =
		componentContext.widgets?.attributeVisualization.component;

	const tabProps: ITabsComponentProps = useMemo(() => {
		const tabProps: ITabsComponentProps = {
			defaultValue: "",
			tabs: [],
		};
		const hideExportsTab =
			settings?.hideExports ||
			(exports.length == 0 && outputs.length == 0);

		if (parameters.length > 0) {
			const props: {
				parameters: PropsParameter[];
				exports?: PropsExport[];
				outputs?: PropsOutput[];
			} = {
				parameters,
			};
			if (hideExportsTab) {
				props.exports = exports;
				props.outputs = outputs;
			}

			tabProps.defaultValue = "Parameters";
			tabProps.tabs.push({
				value: "Parameters",
				tooltip: "Parameters",
				icon: "tabler:adjustments-horizontal",
				children: [
					<ParametersAndExportsAccordionComponent
						key={0}
						{...props}
					/>,
				],
			});
		}
		if (!hideExportsTab) {
			tabProps.defaultValue = tabProps.defaultValue || "Exports";
			tabProps.tabs.push({
				value: "Exports",
				tooltip: "Exports",
				icon: "tabler:download",
				children: [
					<ParametersAndExportsAccordionComponent
						key={1}
						exports={exports}
						outputs={outputs}
						namespace={namespace}
					/>,
				],
			});
		}

		if (!settings?.hideSavedStates) {
			tabProps.tabs.push({
				value: "Saved States",
				tooltip: "Saved States",
				icon: "tabler:bookmarks",
				children: [
					<AppBuilderSavedStatesWidgetComponent
						key={2}
						namespace={namespace}
					/>,
				],
			});
		}

		if (
			!settings?.hideAttributeVisualization &&
			AppBuilderAttributeVisualizationWidgetComponent
		) {
			const hasSdtfData = outputs.some((output) => {
				const outputApi =
					sessionApi?.getOutputById(output.outputId) ||
					sessionApi?.getOutputByName(output.outputId)[0];
				// check if there is an output with sdtf format
				// this is used to determine if the Attributes tab should be shown
				return outputApi && outputApi.chunks;
			});

			if (hasSdtfData) {
				tabProps.tabs.push({
					value: "Attributes",
					tooltip: "Attributes",
					icon: "tabler:tags",
					children: [
						<AppBuilderAttributeVisualizationWidgetComponent
							key={0}
							visualizationMode={
								AttributeVisualizationVisibility.DefaultOn
							}
						/>,
					],
				});
			}
		}

		if (showDesktopClientPanel && !settings?.hideDesktopClients) {
			tabProps.tabs.push({
				value: "Stargate",
				tooltip: "Desktop Clients",
				icon: "tabler:network",
				children: [<DesktopClientPanel key={2} />],
			});
		}

		return tabProps;
	}, [settings, parameters, exports, outputs]);

	return <TabsComponent {...tabProps} />;
}
