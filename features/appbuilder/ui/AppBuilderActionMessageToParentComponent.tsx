import {useAppBuilderActionMessageToParent} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionMessageToParent";
import {IAppBuilderLegacyActionPropsMessageToParent} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

/**
 * Functional component for an "messageToParent" action.
 *
 * @returns
 */
type Props = IAppBuilderLegacyActionPropsMessageToParent &
	AppBuilderActionRenderProps & {};

export default function AppBuilderActionMessageToParentComponent(props: Props) {
	const {
		label = "Message to parent",
		icon = "tabler:message-2-code",
		tooltip,
		type,
		data,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const {trigger, loading} = useAppBuilderActionMessageToParent({
		type,
		data,
		disabled,
	});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={trigger}
			loading={loading}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
