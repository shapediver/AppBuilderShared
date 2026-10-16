import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {create} from "zustand";

/**
 * Button click that is currently running an action.
 * A direct `setContainerVisibility` and an `executeActions` button both
 * publish here. The visibility run reads it. A newer click replaces the
 * previous one; ending an older click does not clear the newer one.
 */
export interface ActionClickSource {
	element: HTMLElement;
	exclusiveContainers: boolean;
	siblingAnchorIds: readonly string[];
	/**
	 * Nested actions when the clicked button is `executeActions`.
	 * Omitted for a single action.
	 */
	actions?: readonly unknown[];
}

interface ActionClickSourceStore {
	source: ActionClickSource | null;
	token: number;
	beginActionClick: (source: ActionClickSource) => number;
	endActionClick: (token: number) => void;
}

const boundAnchorIds = new WeakMap<HTMLElement, Set<string>>();

export interface ActionClickExclusivity {
	exclusiveContainers: boolean;
	siblingAnchorIds: readonly string[];
}

/**
 * Toolbar exclusivity for the action-button click that is in progress.
 * Recorded by the shared action button, then taken by the action that runs.
 */
let notedExclusivity: ActionClickExclusivity | null = null;

export function noteActionClickExclusivity(
	exclusivity: ActionClickExclusivity,
): void {
	notedExclusivity = exclusivity;
}

export function consumeActionClickExclusivity(): ActionClickExclusivity | null {
	const exclusivity = notedExclusivity;
	notedExclusivity = null;
	return exclusivity;
}

export function clearActionClickExclusivity(): void {
	notedExclusivity = null;
}

/** Remember that this click's button docks the 2D anchor. */
export function bindActionClickTrigger(
	element: HTMLElement,
	anchorId: string,
): void {
	useViewportAnchorTriggerRegistry.getState().setTrigger(anchorId, element);
	let ids = boundAnchorIds.get(element);
	if (!ids) {
		ids = new Set();
		boundAnchorIds.set(element, ids);
	}
	ids.add(anchorId);
}

/** Drop 2D triggers that still point at this button. */
export function releaseActionClickTriggers(element: HTMLElement | null): void {
	if (!element) return;
	const ids = boundAnchorIds.get(element);
	if (!ids) return;
	const registry = useViewportAnchorTriggerRegistry.getState();
	for (const id of ids) {
		if (registry.triggers[id] === element) registry.setTrigger(id, null);
	}
	boundAnchorIds.delete(element);
}

export const useActionClickSourceStore = create<ActionClickSourceStore>(
	(set, get) => ({
		source: null,
		token: 0,
		beginActionClick: (source) => {
			const token = get().token + 1;
			set({source, token});
			return token;
		},
		endActionClick: (token) => {
			if (get().token !== token) return;
			set({source: null});
		},
	}),
);
