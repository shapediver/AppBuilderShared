import {useAppBuilderActionCloseConfigurator} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionCloseConfigurator";
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
	const {trigger} = useAppBuilderActionCloseConfigurator({disabled});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={trigger}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
