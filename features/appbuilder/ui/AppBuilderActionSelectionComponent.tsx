import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionSelection} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionSelection";
import {useState} from "react";
import {IAppBuilderLegacyActionPropsSelection} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

/**
 * Functional component for a "selection" action.
 *
 * @returns
 */
type Props = IAppBuilderLegacyActionPropsSelection &
	AppBuilderActionRenderProps & {
		/** Namespace of the parameter if `parameter` has no `sessionId`. */
		namespace: string;
	};

export default function AppBuilderActionSelectionComponent(props: Props) {
	const {
		label = "Select",
		icon = "tabler:hand-finger",
		tooltip,
		select,
		deselect,
		parameter,
		namespace,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const [loading, setLoading] = useState(false);
	const onClick = createActionClickHandler(
		() =>
			runAppBuilderActionSelection(
				{select, deselect, parameter},
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
