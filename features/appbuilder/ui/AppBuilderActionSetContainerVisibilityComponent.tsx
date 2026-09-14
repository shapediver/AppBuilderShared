import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {
	AppBuilderContainerNameType,
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetContainerVisibility,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useAppBuilderActionSetContainerVisibility} from "@AppBuilderLib/features/appbuilder/model/useAppBuilderActionSetContainerVisibility";
import {useCallback, useEffect} from "react";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsSetContainerVisibility &
	IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps & {
		viewportId?: string;
	};

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
		viewportId,
		labelSide,
		labelAlign,
	} = props;

	const {trigger, isOpen} = useAppBuilderActionSetContainerVisibility({
		container,
		mode,
		viewportId,
		disabled,
	});

	const setTrigger = useViewportAnchorTriggerRegistry(
		(state) => state.setTrigger,
	);
	// Register the action button so location-less 2D anchors can dock to it.
	const anchorId =
		container.name === AppBuilderContainerNameType.Anchor2d &&
		container.props?.id
			? container.props.id
			: undefined;

	const handleButtonRef = useCallback(
		(node: HTMLButtonElement | null) => {
			if (anchorId) {
				setTrigger(anchorId, node);
			}
		},
		[anchorId, setTrigger],
	);

	useEffect(() => {
		return () => {
			if (anchorId) {
				setTrigger(anchorId, null);
			}
		};
	}, [anchorId, setTrigger]);

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
			labelSide={labelSide}
			labelAlign={labelAlign}
			buttonRef={anchorId ? handleButtonRef : undefined}
		/>
	);
}
