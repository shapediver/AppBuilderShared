import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {
	AppBuilderContainerNameType,
	IAppBuilderActionDefinition,
	IAppBuilderActionPropsSetContainerVisibility,
	isSetContainerVisibilityAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {
	AppBuilderActionHost,
	AppBuilderActionSetupContext,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {closeSiblingToolbarContainers} from "@AppBuilderLib/features/appbuilder/lib/closeSiblingToolbarContainers";
import {collectActionTargetedAnchorIdsFromDefinitions} from "@AppBuilderLib/features/appbuilder/lib/collectActionTargetedAnchorIds";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";

export type RunAppBuilderActionSetContainerVisibilityProps =
	IAppBuilderActionPropsSetContainerVisibility & {
		viewportId: string;
		/** Toolbar click that started the sequence, when there was one. */
		actionHost?: AppBuilderActionHost;
	};

const triggerRegistrations = new Map<string, number>();
let nextTriggerRegistration = 1;

/**
 * Register the rendered button as the 2D anchor position. A later call for
 * the same anchor replaces this registration, so the previous cleanup does
 * not clear the trigger the new call just wrote.
 */
export function setupAppBuilderActionSetContainerVisibility(
	definition: IAppBuilderActionDefinition,
	context: AppBuilderActionSetupContext,
): (() => void) | void {
	if (!isSetContainerVisibilityAction(definition)) return;
	const container = definition.props.container;
	if (container.name !== AppBuilderContainerNameType.Anchor2d) return;
	const anchorId = container.props?.id;
	if (!anchorId) return;

	const registration = nextTriggerRegistration++;
	triggerRegistrations.set(anchorId, registration);
	useViewportAnchorTriggerRegistry
		.getState()
		.setTrigger(anchorId, context.element);

	return () => {
		if (triggerRegistrations.get(anchorId) !== registration) return;
		triggerRegistrations.delete(anchorId);
		const registry = useViewportAnchorTriggerRegistry.getState();
		if (registry.triggers[anchorId] === context.element) {
			registry.setTrigger(anchorId, null);
		}
	};
}

function anchorsKeptOpen(
	containerId: string,
	actionHost: AppBuilderActionHost,
): readonly string[] | null {
	if (!actionHost.actions) return [containerId];
	const ids = collectActionTargetedAnchorIdsFromDefinitions(
		actionHost.actions,
	).all;
	if (!ids.includes(containerId)) return null;
	return ids;
}

/** Headless "setContainerVisibility" trigger. */
export function runAppBuilderActionSetContainerVisibility(
	props: RunAppBuilderActionSetContainerVisibilityProps,
): void {
	const {container, mode, viewportId, actionHost} = props;
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
			if (actionHost?.exclusiveContainers && willOpen) {
				const keepOpen = anchorsKeptOpen(containerId, actionHost);
				if (keepOpen) {
					closeSiblingToolbarContainers(
						viewportId,
						keepOpen,
						actionHost.siblingAnchorIds,
					);
				}
			}
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
