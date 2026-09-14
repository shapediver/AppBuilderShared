import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionSetParameterValues} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionSetParameterValues";
import {useState} from "react";
import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetParameterValues,
	IAppBuilderLegacyActionPropsSetParameterValue,
} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = (
	| IAppBuilderActionPropsSetParameterValues
	| IAppBuilderLegacyActionPropsSetParameterValue
) &
	IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

/**
 * Functional component for a "setParameterValues" action.
 *
 * @returns
 */
export default function AppBuilderActionSetParameterValuesComponent(
	props: Props,
) {
	const {
		label = "Set parameters",
		icon,
		tooltip,
		namespace,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const [loading, setLoading] = useState(false);
	const onClick = createActionClickHandler(
		() =>
			runAppBuilderActionSetParameterValues(
				"parameterValues" in props
					? {parameterValues: props.parameterValues}
					: {
							parameter: props.parameter,
							value: props.value,
							source: props.source,
						},
				{namespace},
			),
		{disabled, setLoading},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
