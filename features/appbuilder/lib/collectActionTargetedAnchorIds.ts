import {
	AppBuilderContainerNameType,
	IAppBuilderContainer,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export type ActionTargetedAnchorIds = {
	all: string[];
	anchor2d: string[];
	anchor3d: string[];
};

function emptyIds(): ActionTargetedAnchorIds {
	return {all: [], anchor2d: [], anchor3d: []};
}

function addId(
	out: ActionTargetedAnchorIds,
	name: string | undefined,
	id: string | undefined,
) {
	if (!id || !name || out.all.includes(id)) return;
	if (name === AppBuilderContainerNameType.Anchor2d) {
		out.anchor2d.push(id);
		out.all.push(id);
	} else if (name === AppBuilderContainerNameType.Anchor3d) {
		out.anchor3d.push(id);
		out.all.push(id);
	}
}

function collectFromActionDefinition(
	definition: unknown,
	out: ActionTargetedAnchorIds,
) {
	if (!definition || typeof definition !== "object") return;
	const def = definition as {
		type?: string;
		props?: {
			container?: {name?: string; props?: {id?: string}};
			actions?: unknown[];
		};
	};
	if (def.type === "setContainerVisibility") {
		const container = def.props?.container;
		addId(out, container?.name, container?.props?.id);
		return;
	}
	if (def.type !== "executeActions" || !Array.isArray(def.props?.actions)) {
		return;
	}
	for (const nested of def.props.actions) {
		collectFromActionDefinition(nested, out);
	}
}

function listedActionSlots(value: unknown): Array<{action?: unknown}> {
	if (!value) return [];
	const listed = Array.isArray(value) ? value : [value];
	return listed.filter(
		(slot): slot is {action?: unknown} =>
			!!slot && typeof slot === "object",
	);
}

function collectFromActionSlots(slots: unknown, out: ActionTargetedAnchorIds) {
	if (!slots || typeof slots !== "object" || Array.isArray(slots)) return;
	for (const value of Object.values(slots as Record<string, unknown>)) {
		for (const slot of listedActionSlots(value)) {
			collectFromActionDefinition(slot.action, out);
		}
	}
}

function walkToolbarItem(item: unknown, out: ActionTargetedAnchorIds) {
	if (!item || typeof item !== "object") return;
	const typed = item as {
		type?: string;
		props?: Record<string, unknown>;
		actionSlots?: unknown;
	};
	collectFromActionSlots(typed.actionSlots, out);

	if (typed.type === "action") {
		collectFromActionDefinition(
			(typed.props as {definition?: unknown} | undefined)?.definition,
			out,
		);
		return;
	}

	if (typed.type === "actionMenu") {
		const sections = typed.props?.sections;
		if (!Array.isArray(sections)) return;
		for (const section of sections) {
			if (!Array.isArray(section)) continue;
			for (const nested of section) walkToolbarItem(nested, out);
		}
		return;
	}

	if (typed.type === "menu") {
		const sections = typed.props?.sections;
		if (!Array.isArray(sections)) return;
		for (const section of sections) {
			const items = (section as {items?: unknown[]} | undefined)?.items;
			if (!Array.isArray(items)) continue;
			for (const nested of items) walkToolbarItem(nested, out);
		}
	}
}

function walkNode(node: unknown, out: ActionTargetedAnchorIds) {
	if (!node || typeof node !== "object") return;
	const typed = node as {
		actionSlots?: unknown;
		widgets?: unknown[];
		tabs?: unknown[];
		controls?: unknown[];
		groups?: unknown[][];
		props?: {
			widgets?: unknown[];
			tabs?: unknown[];
			controls?: unknown[];
		};
	};
	collectFromActionSlots(typed.actionSlots, out);
	if (Array.isArray(typed.widgets)) {
		for (const widget of typed.widgets) walkNode(widget, out);
	}
	if (Array.isArray(typed.tabs)) {
		for (const tab of typed.tabs) walkNode(tab, out);
	}
	if (Array.isArray(typed.controls)) {
		for (const control of typed.controls) walkNode(control, out);
	}
	if (Array.isArray(typed.groups)) {
		for (const group of typed.groups) {
			if (!Array.isArray(group)) continue;
			for (const item of group) walkToolbarItem(item, out);
		}
	}
	if (Array.isArray(typed.props?.widgets)) {
		for (const widget of typed.props.widgets) walkNode(widget, out);
	}
	if (Array.isArray(typed.props?.tabs)) {
		for (const tab of typed.props.tabs) walkNode(tab, out);
	}
	if (Array.isArray(typed.props?.controls)) {
		for (const control of typed.props.controls) walkNode(control, out);
	}
}

/** Collects anchor ids targeted by setContainerVisibility actions in toolbar groups. */
export function collectActionTargetedAnchorIdsFromGroups(
	groups: unknown[][] | undefined,
): ActionTargetedAnchorIds {
	const out = emptyIds();
	if (!groups) return out;
	for (const group of groups) {
		if (!Array.isArray(group)) continue;
		for (const item of group) walkToolbarItem(item, out);
	}
	return out;
}

/** Collects action-targeted anchor ids from App Builder containers and optional root slots. */
export function collectActionTargetedAnchorIdsFromContainers(
	containers: IAppBuilderContainer[] | undefined,
	rootActionSlots?: unknown,
): ActionTargetedAnchorIds {
	const out = emptyIds();
	collectFromActionSlots(rootActionSlots, out);
	if (!containers) return out;
	for (const container of containers) {
		walkNode(container, out);
	}
	return out;
}
