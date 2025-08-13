import DesktopClientPanel from "@AppBuilderShared/components/shapediver/stargate/DesktopClientPanel";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IAppBuilderSettingsSession} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import React, {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import AppBuilderAttributeVisualizationWidgetComponent from "./widgets/AppBuilderAttributeVisualizationWidgetComponent";

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

	const tabProps: ITabsComponentProps = useMemo(() => {
		const tabProps: ITabsComponentProps = {
			defaultValue: "",
			tabs: [],
		};
		if (parameters.length > 0) {
			tabProps.defaultValue = "Parameters";
			tabProps.tabs.push({
				name: "Parameters",
				icon: IconTypeEnum.AdjustmentsHorizontal,
				children: [
					<ParametersAndExportsAccordionComponent
						key={0}
						parameters={parameters}
					/>,
				],
			});
		}
		if (
			(!settings?.hideExports && exports.length > 0) ||
			(!settings?.hideDataOutputs && outputs.length > 0)
		) {
			tabProps.defaultValue = tabProps.defaultValue || "Exports";
			tabProps.tabs.push({
				name: "Exports",
				icon: IconTypeEnum.Download,
				children: [
					<ParametersAndExportsAccordionComponent
						key={1}
						exports={!settings?.hideExports ? exports : []}
						outputs={!settings?.hideDataOutputs ? outputs : []}
						namespace={namespace}
					/>,
				],
			});
		}

		if (!settings?.hideAttributeVisualization) {
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
					name: "Attributes",
					icon: IconTypeEnum.Tags,
					children: [
						<AppBuilderAttributeVisualizationWidgetComponent
							key={0}
						/>,
					],
				});
			}
		}

		if (showDesktopClientPanel && !settings?.hideDesktopClients) {
			tabProps.tabs.push({
				name: "Stargate",
				icon: IconTypeEnum.Network,
				children: [<DesktopClientPanel key={2} />],
			});
		}

		return tabProps;
	}, [settings, parameters, exports, outputs]);

	return <TabsComponent {...tabProps} />;
}
