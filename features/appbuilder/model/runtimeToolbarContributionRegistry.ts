import type {
	RuntimeToolbarMenuDefinition,
	RuntimeToolbarMenuVisibility,
	ToolbarCommandItem,
	ToolbarMenuItem,
} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {useSyncExternalStore} from "react";

/** A feature-neutral runtime contribution to an App Builder toolbar. */
export interface RuntimeToolbarContribution {
	id: string;
	namespace: string;
	viewportId: string;
	menu: RuntimeToolbarMenuDefinition;
	items: ToolbarMenuItem[];
	commands?: ToolbarCommandItem[];
	sectionId: string;
	menuVisibility?: RuntimeToolbarMenuVisibility;
}

type Snapshot = Readonly<Record<string, RuntimeToolbarContribution>>;

let contributions: Snapshot = {};
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const runtimeToolbarContributionRegistry = {
	register(contribution: RuntimeToolbarContribution) {
		contributions = {...contributions, [contribution.id]: contribution};
		notify();
	},
	update(id: string, patch: Partial<Omit<RuntimeToolbarContribution, "id">>) {
		const existing = contributions[id];
		if (!existing) return;
		contributions = {
			...contributions,
			[id]: {...existing, ...patch},
		};
		notify();
	},
	unregister(id: string) {
		if (!contributions[id]) return;
		const next = {...contributions};
		delete next[id];
		contributions = next;
		notify();
	},
	select(viewportId: string, namespace: string) {
		return Object.values(contributions)
			.filter(
				(contribution) =>
					contribution.viewportId === viewportId &&
					contribution.namespace === namespace,
			)
			.sort((a, b) => a.id.localeCompare(b.id));
	},
	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	getSnapshot: () => contributions,
	reset() {
		contributions = {};
		notify();
	},
};

const useSnapshot = () =>
	useSyncExternalStore(
		runtimeToolbarContributionRegistry.subscribe,
		runtimeToolbarContributionRegistry.getSnapshot,
		runtimeToolbarContributionRegistry.getSnapshot,
	);

export const useRuntimeToolbarContributions = (
	viewportId: string,
	namespace: string,
) => {
	useSnapshot();
	return runtimeToolbarContributionRegistry.select(viewportId, namespace);
};
