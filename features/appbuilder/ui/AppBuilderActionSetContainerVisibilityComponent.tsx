import {
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetContainerVisibility,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useAppBuilderActionSetContainerVisibility} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionSetContainerVisibility";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsSetContainerVisibility &
	IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps;

const DEFAULT_ICON_BY_MODE: Record<Props["mode"], string> = {
	open: "tabler:eye",
	close: "tabler:eye-off",
	toggle: "tabler:eye",
};

/** Changes the visibility of a standard container, viewport anchor, or toolbar. */
export default function AppBuilderActionSetContainerVisibilityComponent(
	props: Props,
) {
	const {
		container,
		mode,
		label = mode === "open"
			? "Open container"
			: mode === "close"
				? "Close container"
				: "Toggle container",
		icon: inputIcon,
		tooltip,
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;
	const {trigger, isOpen} = useAppBuilderActionSetContainerVisibility({
		container,
		mode,
		disabled,
	});
	const icon =
		inputIcon ??
		(mode === "toggle"
			? isOpen
				? "tabler:eye-off"
				: "tabler:eye"
			: DEFAULT_ICON_BY_MODE[mode]);

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
