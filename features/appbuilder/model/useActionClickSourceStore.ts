import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {create} from "zustand";

/**
 * Button click that is currently running an action.
 * A direct `setContainerVisibility` and an `executeActions` button both
 * publish here. The visibility run reads the click that started it.
 * Several clicks can be in flight. Ending one leaves the others in place.
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
	/** Latest click. Kept for callers that have not pinned a token. */
	source: ActionClickSource | null;
	clicks: Record<number, ActionClickSource>;
	token: number;
	beginActionClick: (source: ActionClickSource) => number;
	endActionClick: (token: number) => void;
}

/** The click `token` started, or the latest click when no token is given. */
export function getActionClickSource(token?: number): ActionClickSource | null {
	const state = useActionClickSourceStore.getState();
	if (token == null) return state.source;
	return state.clicks[token] ?? null;
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
		clicks: {},
		token: 0,
		beginActionClick: (source) => {
			const token = get().token + 1;
			set({
				source,
				token,
				clicks: {...get().clicks, [token]: source},
			});
			return token;
		},
		endActionClick: (token) => {
			const clicks = {...get().clicks};
			if (!(token in clicks)) return;
			delete clicks[token];
			const remaining = Object.keys(clicks).map(Number);
			const latest = remaining.length ? Math.max(...remaining) : null;
			set({
				clicks,
				source: latest == null ? null : clicks[latest],
			});
		},
	}),
);
