import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionMessageToParent} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionMessageToParent";
import {useState} from "react";
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
	const [loading, setLoading] = useState(false);
	const onClick = createActionClickHandler(
		() => runAppBuilderActionMessageToParent({type, data}),
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
