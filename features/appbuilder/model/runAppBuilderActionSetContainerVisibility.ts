import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {
	AppBuilderContainerNameType,
	IAppBuilderActionPropsSetContainerVisibility,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {closeSiblingToolbarContainers} from "@AppBuilderLib/features/appbuilder/lib/closeSiblingToolbarContainers";
import {collectSetContainerVisibilityTargets} from "@AppBuilderLib/features/appbuilder/lib/collectSetContainerVisibilityTargets";
import {
	bindActionClickTrigger,
	useActionClickSourceStore,
} from "@AppBuilderLib/features/appbuilder/model/useActionClickSourceStore";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";

export type RunAppBuilderActionSetContainerVisibilityProps =
	IAppBuilderActionPropsSetContainerVisibility & {
		viewportId: string;
	};

/** Anchor ids a click's sequence opens, closes, or toggles. */
function targetedAnchorIds(actions: readonly unknown[]): string[] {
	const ids: string[] = [];
	for (const target of collectSetContainerVisibilityTargets(actions)) {
		if (
			target.name !== AppBuilderContainerNameType.Anchor2d &&
			target.name !== AppBuilderContainerNameType.Anchor3d
		) {
			continue;
		}
		if (target.id && !ids.includes(target.id)) ids.push(target.id);
	}
	return ids;
}

/**
 * Dock a 2D anchor to the button that started this click, and close the
 * toolbar's other action-targeted anchors when this click will open one.
 * Anchors the same sequence targets stay untouched here; their own actions
 * set their final state. No-op when this run is not part of that click.
 */
function applyActionClickSource(
	viewportId: string,
	containerName: string,
	containerId: string,
	willOpen: boolean,
): void {
	const source = useActionClickSourceStore.getState().source;
	if (!source) return;

	const sequenceIds = source.actions
		? targetedAnchorIds(source.actions)
		: undefined;
	if (sequenceIds && !sequenceIds.includes(containerId)) return;

	if (containerName === AppBuilderContainerNameType.Anchor2d) {
		bindActionClickTrigger(source.element, containerId);
	}

	if (!willOpen || !source.exclusiveContainers) return;

	const keepOpen = sequenceIds ? [...sequenceIds] : [containerId];
	if (!keepOpen.includes(containerId)) keepOpen.push(containerId);
	closeSiblingToolbarContainers(
		viewportId,
		keepOpen,
		source.siblingAnchorIds,
	);
}

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
			const willOpen =
				mode === "toggle"
					? !(anchor?.showContent ?? false)
					: mode === "open";
			applyActionClickSource(
				viewportId,
				container.name,
				containerId,
				willOpen,
			);
			viewportAnchors.updateShowContent(
				viewportId,
				containerId,
				willOpen,
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
