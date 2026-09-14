import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionSetBrowserLocation} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionSetBrowserLocation";
import {useState} from "react";
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
	const [loading, setLoading] = useState(false);
	const {viewportId} = useViewportId();
	const onClick = createActionClickHandler(
		() =>
			runAppBuilderActionSetBrowserLocation(
				{href, pathname, search, hash, target},
				{namespace, viewportId},
			),
		{disabled, setLoading},
	);

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			loading={loading}
			onClick={onClick}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
