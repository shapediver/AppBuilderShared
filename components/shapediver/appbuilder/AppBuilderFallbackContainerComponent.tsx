import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ITreeNode} from "@shapediver/viewer.session";
import React, {useCallback, useEffect, useMemo} from "react";
import {useShallow} from "zustand/react/shallow";
import AppBuilderAttributeVisualizationWidgetComponent from "./widgets/AppBuilderAttributeVisualizationWidgetComponent";

interface Props {
	namespace: string;
	parameters: PropsParameter[];
	exports: PropsExport[];
}

export default function AppBuilderFallbackContainerComponent({
	namespace,
	parameters,
	exports,
}: Props) {
	const {sessionApi, addSessionUpdateCallback} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessionApi: state.sessions[namespace],
			addSessionUpdateCallback: state.addSessionUpdateCallback,
		})),
	);

	const [hasSdTFData, setHasSdTFData] = React.useState<boolean>(false);

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
		if (exports.length > 0) {
			tabProps.defaultValue = tabProps.defaultValue || "Exports";
			tabProps.tabs.push({
				name: "Exports",
				icon: IconTypeEnum.Download,
				children: [
					<ParametersAndExportsAccordionComponent
						key={0}
						exports={exports}
					/>,
				],
			});
		}

		if (hasSdTFData) {
			tabProps.defaultValue = tabProps.defaultValue || "Attributes";
			tabProps.tabs.push({
				name: "Attributes",
				icon: IconTypeEnum.Tags,
				children: [
					<AppBuilderAttributeVisualizationWidgetComponent key={0} />,
				],
			});
		}

		return tabProps;
	}, [parameters, exports, hasSdTFData]);

	/**
	 * Session update callback to check for SDTF data in the session outputs.
	 */
	const sessionUpdateCallback = useCallback(
		(newNode?: ITreeNode) => {
			if (!newNode) return;

			for (const o in sessionApi.outputs) {
				const output = sessionApi.outputs[o];
				if (output.content && output.content.length > 0) {
					for (let i = 0; i < output.content.length; i++) {
						if (output.content[i].format === "sdtf")
							setHasSdTFData(true);
					}
				}
			}
		},
		[sessionApi],
	);

	/**
	 * Effect to add the session update callback to the session API.
	 */
	useEffect(() => {
		const removeSessionUpdateCallback = addSessionUpdateCallback(
			namespace,
			sessionUpdateCallback,
		);

		return () => {
			removeSessionUpdateCallback();
		};
	}, [sessionApi, sessionUpdateCallback]);

	return <TabsComponent {...tabProps} />;
}
