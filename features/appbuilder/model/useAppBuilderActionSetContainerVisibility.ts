import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	AppBuilderContainerNameType,
	IAppBuilderActionPropsSetContainerVisibility,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {useCallback} from "react";

export interface UseAppBuilderActionSetContainerVisibilityProps extends IAppBuilderActionPropsSetContainerVisibility {
	viewportId?: string;
	disabled?: boolean;
}

/**
 * Hook providing executable logic and open state for a "setContainerVisibility" action.
 * Can be called to trigger container open/close/toggle without mounting an action component.
 */
export function useAppBuilderActionSetContainerVisibility(
	props: UseAppBuilderActionSetContainerVisibilityProps,
) {
	const {container, mode, viewportId: inputViewportId, disabled} = props;
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

	const trigger = useCallback(() => {
		if (disabled) return;
		switch (container.name) {
			case AppBuilderContainerNameType.Left:
			case AppBuilderContainerNameType.Right:
			case AppBuilderContainerNameType.Top:
			case AppBuilderContainerNameType.Bottom: {
				const standardContainers =
					useShapeDiverStoreStandardContainers.getState();
				standardContainers.setContainerOpen(
					container.name,
					mode === "toggle"
						? !standardContainers.containerOpen[container.name]
						: mode === "open",
				);
				break;
			}
			case AppBuilderContainerNameType.Anchor2d:
			case AppBuilderContainerNameType.Anchor3d: {
				if (!containerId) return;
				const viewportAnchors =
					useShapeDiverStoreViewportAnchors.getState();
				const anchor = viewportAnchors.anchors[viewportId]?.find(
					(candidate) =>
						candidate.id === containerId &&
						candidate.type === container.name,
				);
				viewportAnchors.updateShowContent(
					viewportId,
					containerId,
					mode === "toggle"
						? !(anchor?.showContent ?? false)
						: mode === "open",
				);
				break;
			}
			case AppBuilderContainerNameType.Toolbar: {
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
		}
	}, [container.name, containerId, disabled, mode, viewportId]);

	return {
		trigger,
		isOpen,
		disabled: !!disabled,
	};
}
