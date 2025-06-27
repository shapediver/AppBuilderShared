import DesktopClientPanel from "@AppBuilderShared/components/shapediver/stargate/DesktopClientPanel";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import React, {useMemo} from "react";
import {useShallow} from "zustand/react/shallow";

interface Props {
	parameters: PropsParameter[];
	exports: PropsExport[];
	outputs: PropsOutput[];
	namespace?: string;
}

export default function AppBuilderFallbackContainerComponent({
	parameters,
	exports,
	outputs,
	namespace,
}: Props) {
	const showDesktopClientPanel = useShapeDiverStoreStargate(
		useShallow((state) => state.referenceCount > 0),
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
		if (exports.length > 0 || outputs.length > 0) {
			tabProps.defaultValue = tabProps.defaultValue || "Exports";
			tabProps.tabs.push({
				name: "Exports",
				icon: IconTypeEnum.Download,
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

		if (showDesktopClientPanel) {
			tabProps.tabs.push({
				name: "Stargate",
				icon: IconTypeEnum.Network,
				children: [<DesktopClientPanel key={2} />],
			});
		}
		return tabProps;
	}, [parameters, exports, outputs]);

	return <TabsComponent {...tabProps} />;
}
