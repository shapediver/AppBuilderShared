import AcceptRejectButtons from "@AppBuilderShared/components/shapediver/ui/AcceptRejectButtons";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import React, {useMemo} from "react";

interface Props {
	parameters: PropsParameter[];
	exports: PropsExport[];
}

export default function AppBuilderFallbackContainerComponent({
	parameters,
	exports,
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
