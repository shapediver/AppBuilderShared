import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	AppBuilderContainerNameType,
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetContainerVisibility,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {useCallback} from "react";
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
	const {viewportId: defaultViewportId} = useViewportId();
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
		return state.anchors[defaultViewportId]?.find(
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
	const icon =
		inputIcon ??
		(mode === "toggle"
			? isOpen
				? "tabler:eye-off"
				: "tabler:eye"
			: DEFAULT_ICON_BY_MODE[mode]);

	const onClick = useCallback(() => {
		if (disabled) return;
		switch (container.name) {
			case AppBuilderContainerNameType.Left:
			case AppBuilderContainerNameType.Right:
			case AppBuilderContainerNameType.Top:
			case AppBuilderContainerNameType.Bottom:
				const standardContainers =
					useShapeDiverStoreStandardContainers.getState();
				standardContainers.setContainerOpen(
					container.name,
					mode === "toggle"
						? !standardContainers.containerOpen[container.name]
						: mode === "open",
				);
				break;
			case AppBuilderContainerNameType.Anchor2d:
			case AppBuilderContainerNameType.Anchor3d:
				if (!containerId) return;
				const viewportAnchors =
					useShapeDiverStoreViewportAnchors.getState();
				const anchor = viewportAnchors.anchors[defaultViewportId]?.find(
					(candidate) =>
						candidate.id === containerId &&
						candidate.type === container.name,
				);
				viewportAnchors.updateShowContent(
					defaultViewportId,
					containerId,
					mode === "toggle"
						? !(anchor?.showContent ?? false)
						: mode === "open",
				);
				break;
			case AppBuilderContainerNameType.Toolbar:
				if (!containerId) return;
				const toolbars = useShapeDiverStoreToolbars.getState();
				toolbars.setToolbarOpen(
					containerId,
					mode === "toggle"
						? !(toolbars.toolbarOpen[containerId] ?? true)
						: mode === "open",
				);
				break;
		}
	}, [container, containerId, defaultViewportId, disabled, mode]);

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
