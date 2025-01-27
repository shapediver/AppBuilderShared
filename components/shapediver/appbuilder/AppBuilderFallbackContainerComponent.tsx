import React, {useMemo} from "react";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import AcceptRejectButtons from "@AppBuilderShared/components/shapediver/ui/AcceptRejectButtons";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import AppBuilderAgentWidgetComponent from "./widgets/AppBuilderAgentWidgetComponent";

interface Props {
	parameters: PropsParameter[];
	exports: PropsExport[];
	namespace: string;
}

export default function AppBuilderFallbackContainerComponent({
	parameters,
	exports,
	namespace,
}: Props) {
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
						topSection={
							<AcceptRejectButtons parameters={parameters} />
						}
					/>,
					// SS-8371 add AppBuilderAgentWidgetComponent for testing
					<AppBuilderAgentWidgetComponent
						key={1}
						namespace={namespace}
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

		return tabProps;
	}, [parameters, exports]);

	return <TabsComponent {...tabProps} />;
}
