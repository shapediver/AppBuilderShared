import {useSessionPropsOutput} from "@AppBuilderShared/hooks/shapediver/parameters/useSessionPropsOutput";
import {IAppBuilderWidgetPropsDesktopClientOutputs} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";
import ParametersAndExportsAccordionComponent from "../../ui/ParametersAndExportsAccordionComponent";

interface Props extends IAppBuilderWidgetPropsDesktopClientOutputs {
	namespace: string;
}

export default function AppBuilderDesktopClientOutputsWidgetComponent(
	props: Props,
) {
	const {namespace} = props;

	const outputs = useSessionPropsOutput(
		namespace,
		(output) => !!output.chunks,
	);

	return (
		<ParametersAndExportsAccordionComponent
			outputs={outputs}
			namespace={namespace}
		/>
	);
}
