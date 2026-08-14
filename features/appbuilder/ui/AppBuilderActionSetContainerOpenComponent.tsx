import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	AppBuilderContainerNameType,
	IAppBuilderActionPropsCommon,
	IAppBuilderActionPropsSetContainerOpen,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {useCallback} from "react";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderActionPropsSetContainerOpen &
	IAppBuilderActionPropsCommon &
	AppBuilderActionRenderProps;

const DEFAULT_ICON_BY_MODE: Record<Props["mode"], string> = {
	open: "tabler:eye",
	close: "tabler:eye-off",
	toggle: "tabler:eye",
};

/** Opens or closes a standard container, viewport anchor, or toolbar. */
export default function AppBuilderActionSetContainerOpenComponent(
	props: Props,
) {
	const {
		container,
		mode,
		label =
			mode === "open"
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
		return state.anchors[defaultViewportId]
			?.find(
				(anchor) =>
					anchor.id === container.props.id &&
					anchor.type === container.name,
			)
			?.showContent;
	});
	const toolbarOpen = useShapeDiverStoreToolbars((state) =>
		container.name === AppBuilderContainerNameType.Toolbar
			? (state.toolbarOpen[container.props.id] ?? true)
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
				const viewportAnchors =
					useShapeDiverStoreViewportAnchors.getState();
				const anchor = viewportAnchors.anchors[defaultViewportId]?.find(
					(candidate) =>
						candidate.id === container.props.id &&
						candidate.type === container.name,
				);
				viewportAnchors.updateShowContent(
					defaultViewportId,
					container.props.id,
					mode === "toggle" ? !(anchor?.showContent ?? false) : mode === "open",
				);
				break;
			case AppBuilderContainerNameType.Toolbar:
				const toolbars = useShapeDiverStoreToolbars.getState();
				toolbars.setToolbarOpen(
					container.props.id,
					mode === "toggle"
						? !(toolbars.toolbarOpen[container.props.id] ?? true)
						: mode === "open",
				);
				break;
		}
	}, [container, defaultViewportId, disabled, mode]);

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
