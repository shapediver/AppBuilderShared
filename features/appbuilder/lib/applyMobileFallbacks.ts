import {
	IAppBuilderMobileFallbacks,
	IAppBuilderStandardContainer,
	IAppBuilderStandardContainerMobileFallback,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderStandardContainerNames,
	AppBuilderStandardContainerNameType,
} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreStandardContainers";
import type {
	AdditionalContainerContentMap,
	StandardContainersMap,
} from "./mergeStandardContainerContent";
import {overlayDefinedFields} from "./overlayDefinedFields";

export type {StandardContainersMap};

export type ApplyMobileFallbacksOptions = {
	onWarn?: (message: string) => void;
};

export type MobileFallbackInjection = {
	from: AppBuilderStandardContainerNameType;
	to: AppBuilderStandardContainerNameType;
	position: "before" | "after";
	order: number;
};

export type MobileFallbackPlan = {
	/** Source slots whose JSON original content is not rendered in place. */
	hideOriginal: AppBuilderStandardContainerNameType[];
	/** One-hop moves of original JSON content into another slot. */
	injections: MobileFallbackInjection[];
};

type ResolvedFallback =
	| {kind: "keep"}
	| {kind: "hide"}
	| {
			kind: "move";
			target: AppBuilderStandardContainerNameType;
			position: "before" | "after";
			order: number;
	  };

function resolveDeclaredFallback(
	name: AppBuilderStandardContainerNameType,
	container: IAppBuilderStandardContainer | undefined,
	themeFallbacks: IAppBuilderMobileFallbacks | undefined,
): IAppBuilderStandardContainerMobileFallback | undefined {
	return overlayDefinedFields(
		themeFallbacks?.[name],
		container?.props?.mobileFallback,
	);
}

function toResolved(
	name: AppBuilderStandardContainerNameType,
	fallback: IAppBuilderStandardContainerMobileFallback | undefined,
	onWarn: (message: string) => void,
): ResolvedFallback {
	if (!fallback) {
		return {kind: "keep"};
	}
	if (fallback.disabled) {
		return {kind: "hide"};
	}
	if (!fallback.container) {
		return {kind: "keep"};
	}
	if (fallback.container === name) {
		onWarn(
			`mobileFallback for "${name}" targets itself; the container is left in place.`,
		);
		return {kind: "keep"};
	}
	return {
		kind: "move",
		target: fallback.container,
		position: fallback.position ?? "after",
		order: fallback.order ?? 0,
	};
}

function nameIndex(name: AppBuilderStandardContainerNameType): number {
	return AppBuilderStandardContainerNames.indexOf(name);
}

/**
 * Plan mobile fallbacks for standard containers.
 *
 * Theme `mobileFallbacks[name]` is the general default. JSON
 * `props.mobileFallback` overlays defined fields for that container.
 * `disabled` hides original content without moving it (anchor precedent).
 * Moves are one hop of original JSON content only; the target still applies
 * its own fallback to *its* original content.
 */
export function planMobileFallbacks(
	containers: StandardContainersMap,
	themeFallbacks?: IAppBuilderMobileFallbacks,
	options?: ApplyMobileFallbacksOptions,
): MobileFallbackPlan {
	const onWarn = options?.onWarn ?? (() => undefined);
	const hideOriginal: AppBuilderStandardContainerNameType[] = [];
	const injections: MobileFallbackInjection[] = [];

	for (const name of AppBuilderStandardContainerNames) {
		const resolved = toResolved(
			name,
			resolveDeclaredFallback(name, containers[name], themeFallbacks),
			onWarn,
		);
		if (resolved.kind === "hide") {
			hideOriginal.push(name);
			continue;
		}
		if (resolved.kind !== "move") {
			continue;
		}
		const source = containers[name];
		const hasOriginal =
			!!source &&
			((source.tabs?.length ?? 0) > 0 ||
				(source.widgets?.length ?? 0) > 0);
		hideOriginal.push(name);
		if (hasOriginal) {
			injections.push({
				from: name,
				to: resolved.target,
				position: resolved.position,
				order: resolved.order,
			});
		}
	}

	injections.sort((a, b) => {
		if (a.to !== b.to) {
			return nameIndex(a.to) - nameIndex(b.to);
		}
		if (a.order !== b.order) {
			return a.order - b.order;
		}
		return nameIndex(a.from) - nameIndex(b.from);
	});

	return {hideOriginal, injections};
}

/**
 * Defaults used for layout: original JSON is omitted for slots that hide or
 * move, so additional content (anchors, injections) can still fill them.
 */
export function defaultsWithoutHiddenOriginals(
	containers: StandardContainersMap,
	hideOriginal: readonly AppBuilderStandardContainerNameType[],
): StandardContainersMap {
	const hidden = new Set(hideOriginal);
	const result: StandardContainersMap = {
		left: undefined,
		right: undefined,
		top: undefined,
		bottom: undefined,
	};
	for (const name of AppBuilderStandardContainerNames) {
		result[name] = hidden.has(name) ? undefined : containers[name];
	}
	return result;
}

/**
 * Copy additional content and add one-hop original injections from the plan.
 * `renderOriginal` returns the source’s original content as JSX (or undefined
 * to skip). Position/order come from the plan.
 */
export function additionalWithMobileFallbackInjections(
	additional: AdditionalContainerContentMap,
	plan: MobileFallbackPlan,
	renderOriginal: (
		from: AppBuilderStandardContainerNameType,
		to: AppBuilderStandardContainerNameType,
	) => JSX.Element | undefined,
): AdditionalContainerContentMap {
	const next: AdditionalContainerContentMap = {
		left: {...additional.left},
		right: {...additional.right},
		top: {...additional.top},
		bottom: {...additional.bottom},
	};
	for (const injection of plan.injections) {
		const content = renderOriginal(injection.from, injection.to);
		if (!content) {
			continue;
		}
		next[injection.to] = {
			...next[injection.to],
			[`mobile-fallback-${injection.from}`]: {
				content,
				position: injection.position,
				order: injection.order,
			},
		};
	}
	return next;
}
