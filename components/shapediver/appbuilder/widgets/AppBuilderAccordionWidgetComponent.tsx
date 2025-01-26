import React, { useMemo } from "react";
import { PropsExport } from "@AppBuilderShared/types/components/shapediver/propsExport";
import { PropsParameter } from "@AppBuilderShared/types/components/shapediver/propsParameter";
import { IAppBuilderWidgetPropsAccordion } from "@AppBuilderShared/types/shapediver/appbuilder";
import ParametersAndExportsAccordionComponent
	from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import AcceptRejectButtons from "@AppBuilderShared/components/shapediver/ui/AcceptRejectButtons";


interface Props extends IAppBuilderWidgetPropsAccordion {
	/**
	 * Default session namespace to use for parameter and export references that do
	 * not specify a session namespace.
	 */
	namespace: string
}

export default function AppBuilderAccordionWidgetComponent({ namespace, parameters = [], exports = [], defaultGroupName }: Props) {

	const parameterProps: PropsParameter[] = useMemo(() => parameters.map(p => {
		return {
			namespace: p.sessionId ?? namespace,
			parameterId: p.name,
			disableIfDirty: p.disableIfDirty,
			acceptRejectMode: p.acceptRejectMode,
			overrides: p.overrides
		};
	}), [parameters, namespace]);

	const exportProps: PropsExport[] = useMemo(() => exports.map(p => {
		return {
			namespace: p.sessionId ?? namespace,
			exportId: p.name,
			overrides: p.overrides
		};
	}), [exports, namespace]);

	return <ParametersAndExportsAccordionComponent
		parameters={parameterProps}
		exports={exportProps}
		defaultGroupName={defaultGroupName}
		topSection={<AcceptRejectButtons parameters={parameterProps}/>}
	/>;

}
