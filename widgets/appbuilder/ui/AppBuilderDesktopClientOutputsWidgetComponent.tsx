import {useSessionPropsOutput} from "@AppBuilderLib/entities/output/model/useSessionPropsOutput";
import {IAppBuilderWidgetPropsDesktopClientOutputs} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
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
