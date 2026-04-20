import {useSessionPropsOutput} from "@AppBuilderLib/entities/output";
import {IAppBuilderWidgetPropsDesktopClientOutputs} from "@AppBuilderLib/features/appbuilder";
import React from "react";
import ParametersAndExportsAccordionComponent from "./ParametersAndExportsAccordionComponent";

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
