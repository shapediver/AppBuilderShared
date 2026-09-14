import {useAppBuilderActionSetParameterValues} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionSetParameterValues";
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
	const {trigger, disabled: resolvedDisabled} =
		useAppBuilderActionSetParameterValues({
			...props,
			namespace,
			disabled,
		});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={trigger}
			disabled={resolvedDisabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
