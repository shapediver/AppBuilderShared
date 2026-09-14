import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {
	AppBuilderContainerNameType,
	IAppBuilderActionPropsSetContainerVisibility,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";

export type RunAppBuilderActionSetContainerVisibilityProps =
	IAppBuilderActionPropsSetContainerVisibility & {
		viewportId: string;
	};

/** Headless "setContainerVisibility" trigger. */
export function runAppBuilderActionSetContainerVisibility(
	props: RunAppBuilderActionSetContainerVisibilityProps,
): void {
	const {container, mode, viewportId} = props;
	const containerId = container.props?.id;

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
}
