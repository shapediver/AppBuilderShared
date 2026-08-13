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
	/** Sections sharing a toolbar group are rendered without a divider. */
	groupId?: string;
	order?: number;
	menuVisibility?: RuntimeToolbarMenuVisibility;
}

type Snapshot = Readonly<Record<string, RuntimeToolbarContribution>>;

let contributions: Snapshot = {};
type RegistrationToken = symbol;
const registrations = new Map<
	string,
	Map<RegistrationToken, RuntimeToolbarContribution>
>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const syncContribution = (id: string) => {
	const registered = registrations.get(id);
	const contribution = registered
		? Array.from(registered.values()).at(-1)
		: undefined;
	if (contribution) {
		contributions = {...contributions, [id]: contribution};
		return;
	}
	const next = {...contributions};
	delete next[id];
	contributions = next;
};

export const runtimeToolbarContributionRegistry = {
	register(contribution: RuntimeToolbarContribution) {
		const token = Symbol(contribution.id);
		const registered =
			registrations.get(contribution.id) ??
			new Map<RegistrationToken, RuntimeToolbarContribution>();
		registered.set(token, contribution);
		registrations.set(contribution.id, registered);
		syncContribution(contribution.id);
		notify();
		return token;
	},
	update(
		id: string,
		patch: Partial<Omit<RuntimeToolbarContribution, "id">>,
		token?: RegistrationToken,
	) {
		const registered = registrations.get(id);
		if (!registered) return;
		if (token) {
			const existing = registered.get(token);
			if (!existing) return;
			registered.set(token, {...existing, ...patch});
		} else {
			registered.forEach((existing, registrationToken) =>
				registered.set(registrationToken, {...existing, ...patch}),
			);
		}
		syncContribution(id);
		notify();
	},
	unregister(id: string, token?: RegistrationToken) {
		const registered = registrations.get(id);
		if (!registered) return;
		if (token) registered.delete(token);
		else registered.clear();
		if (registered.size === 0) registrations.delete(id);
		syncContribution(id);
		notify();
	},
	select(viewportId: string, namespace: string) {
		return Object.values(contributions)
			.filter(
				(contribution) =>
					contribution.viewportId === viewportId &&
					contribution.namespace === namespace,
			)
			.sort(
				(a, b) =>
					(a.order ?? Infinity) - (b.order ?? Infinity) ||
					a.id.localeCompare(b.id),
			);
	},
	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},
	getSnapshot: () => contributions,
	reset() {
		contributions = {};
		registrations.clear();
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
