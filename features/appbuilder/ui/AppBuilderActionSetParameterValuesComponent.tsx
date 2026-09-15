import {useHasPendingParameterChanges} from "@AppBuilderLib/entities/parameter/model/useHasPendingParameterChanges";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
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
		viewportId?: string;
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
		viewportId: inputViewportId,
	} = props;
	const [loading, setLoading] = useState(false);
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = inputViewportId ?? defaultViewportId;
	const hasPendingChanges = useHasPendingParameterChanges(namespace);
	const resolvedDisabled = disabled || hasPendingChanges;
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
				{namespace, viewportId},
			),
		{disabled: resolvedDisabled, setLoading},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
