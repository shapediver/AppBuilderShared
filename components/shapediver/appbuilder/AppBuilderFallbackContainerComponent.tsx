import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import DesktopClientPanel from "@AppBuilderShared/components/ui/stargate/DesktopClientPanel";
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

if (
			parameters.length > 0 &&
			parameters.some((p) => isStargateParameter(p.type))
		) {
			tabProps.tabs.push({
				name: "Stargate",
				icon: IconTypeEnum.Network,
				children: [<DesktopClientPanel key={2} />],
			});
		}
		return tabProps;
	}, [parameters, exports]);

	return <TabsComponent {...tabProps} />;
}
