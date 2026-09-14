import {useAppBuilderActionSetBrowserLocation} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionSetBrowserLocation";
import {IAppBuilderLegacyActionPropsSetBrowserLocation} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsSetBrowserLocation &
	AppBuilderActionRenderProps & {
		namespace: string;
	};

/**
 * Functional component for a "setBrowserLocation" action.
 *
 * @returns
 */
export default function AppBuilderActionSetBrowserLocationComponent(
	props: Props,
) {
	const {
		label = "Set location",
		icon,
		tooltip,
		href,
		pathname,
		search,
		hash,
		namespace,
		target,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const {trigger, loading} = useAppBuilderActionSetBrowserLocation({
		href,
		pathname,
		search,
		hash,
		namespace,
		target,
		disabled,
	});

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			loading={loading}
			onClick={trigger}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
