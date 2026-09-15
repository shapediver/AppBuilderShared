import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {createActionClickHandler} from "@AppBuilderLib/features/appbuilder/lib/createActionClickHandler";
import {runAppBuilderActionSetContainerVisibility} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionSetContainerVisibility";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {useCallback, useEffect} from "react";
import {
	AppBuilderContainerNameType,
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetContainerVisibility,
} from "../config/appbuilder";
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
		viewportId: inputViewportId,
		labelSide,
		labelAlign,
	} = props;
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = inputViewportId ?? defaultViewportId;
	const containerId = container.props?.id;

	const standardContainerOpen = useShapeDiverStoreStandardContainers(
		(state) => {
			switch (container.name) {
				case AppBuilderContainerNameType.Left:
				case AppBuilderContainerNameType.Right:
				case AppBuilderContainerNameType.Top:
				case AppBuilderContainerNameType.Bottom:
					return state.containerOpen[container.name];
				default:
					return undefined;
			}
		},
	);

	const anchorOpen = useShapeDiverStoreViewportAnchors((state) => {
		if (
			container.name !== AppBuilderContainerNameType.Anchor2d &&
			container.name !== AppBuilderContainerNameType.Anchor3d
		)
			return undefined;
		return state.anchors[viewportId]?.find(
			(anchor) =>
				anchor.id === containerId && anchor.type === container.name,
		)?.showContent;
	});

	const toolbarOpen = useShapeDiverStoreToolbars((state) =>
		container.name === AppBuilderContainerNameType.Toolbar
			? (state.toolbarOpen[containerId ?? ""] ?? true)
			: undefined,
	);

	const isOpen = standardContainerOpen ?? anchorOpen ?? toolbarOpen ?? false;
	const onClick = createActionClickHandler(
		() =>
			runAppBuilderActionSetContainerVisibility({
				container,
				mode,
				viewportId,
			}),
		{disabled},
	);

	const setTrigger = useViewportAnchorTriggerRegistry(
		(state) => state.setTrigger,
	);
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
			onClick={onClick}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
			labelSide={labelSide}
			labelAlign={labelAlign}
			buttonRef={anchorId ? handleButtonRef : undefined}
		/>
	);
}
