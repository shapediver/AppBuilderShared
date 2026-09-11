import {
	AppBuilderContainerNameType,
	IAppBuilderContainer,
	IAppBuilderToolbarContainer,
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

function collectFromVisibilityAction(
	definition: unknown,
	out: ActionTargetedAnchorIds,
) {
	if (!definition || typeof definition !== "object") return;
	const def = definition as {
		type?: string;
		props?: {
			container?: {name?: string; props?: {id?: string}};
		};
	};
	if (def.type !== "setContainerVisibility") return;
	const container = def.props?.container;
	addId(out, container?.name, container?.props?.id);
}

function walkToolbarItem(item: unknown, out: ActionTargetedAnchorIds) {
	if (!item || typeof item !== "object") return;
	const typed = item as {type?: string; props?: Record<string, unknown>};

	if (typed.type === "action") {
		collectFromVisibilityAction(
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

/** Collects action-targeted anchor ids from App Builder containers (toolbar definitions). */
export function collectActionTargetedAnchorIdsFromContainers(
	containers: IAppBuilderContainer[] | undefined,
): ActionTargetedAnchorIds {
	const out = emptyIds();
	if (!containers) return out;
	for (const container of containers) {
		if (container.name !== AppBuilderContainerNameType.Toolbar) continue;
		const collected = collectActionTargetedAnchorIdsFromGroups(
			(container as IAppBuilderToolbarContainer).groups,
		);
		for (const id of collected.anchor2d) {
			addId(out, AppBuilderContainerNameType.Anchor2d, id);
		}
		for (const id of collected.anchor3d) {
			addId(out, AppBuilderContainerNameType.Anchor3d, id);
		}
	}
	return out;
}
