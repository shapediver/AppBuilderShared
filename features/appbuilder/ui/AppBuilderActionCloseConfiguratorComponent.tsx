import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionCloseConfigurator} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCloseConfigurator";
import {IAppBuilderLegacyActionPropsCloseConfigurator} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsCloseConfigurator &
	AppBuilderActionRenderProps & {};

/**
 * Functional component for an "closeConfigurator" action.
 *
 * @returns
 */
export default function AppBuilderActionCloseConfiguratorComponent(
	props: Props,
) {
	const {
		label = "Close configurator",
		icon = "tabler:x",
		tooltip,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const onClick = createActionClickHandler(
		() => runAppBuilderActionCloseConfigurator(),
		{disabled},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
