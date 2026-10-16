import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionType";
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export interface SetContainerVisibilityTarget {
	name: string;
	id?: string;
	mode: "open" | "close" | "toggle";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object";
}

/**
 * Walks an `executeActions` list, including nested sequences, and returns every
 * `setContainerVisibility` target in order.
 */
export function collectSetContainerVisibilityTargets(
	actions: readonly unknown[],
): SetContainerVisibilityTarget[] {
	const out: SetContainerVisibilityTarget[] = [];

	const visit = (definition: unknown) => {
		if (!isRecord(definition)) return;
		const props = isRecord(definition.props) ? definition.props : undefined;

		if (definition.type === AppBuilderActionType.SetContainerVisibility) {
			const container =
				props && isRecord(props.container)
					? props.container
					: undefined;
			const name =
				container && typeof container.name === "string"
					? container.name
					: undefined;
			const mode = props?.mode;
			if (
				!name ||
				(mode !== "open" && mode !== "close" && mode !== "toggle")
			) {
				return;
			}
			const containerProps =
				container && isRecord(container.props)
					? container.props
					: undefined;
			const id =
				containerProps && typeof containerProps.id === "string"
					? containerProps.id
					: undefined;
			out.push({name, id, mode});
			return;
		}

		if (
			definition.type === AppBuilderActionType.ExecuteActions &&
			props &&
			Array.isArray(props.actions)
		) {
			for (const nested of props.actions) visit(nested);
		}
	};

	for (const action of actions) visit(action);
	return out;
}

/** Anchor ids a visibility sequence will show, using the current open state for toggles. */
export function collectOpeningAnchorIds(
	actions: readonly unknown[],
	isOpen: (id: string, name: string) => boolean,
): string[] {
	const ids: string[] = [];
	for (const target of collectSetContainerVisibilityTargets(actions)) {
		if (
			target.name !== AppBuilderContainerNameType.Anchor2d &&
			target.name !== AppBuilderContainerNameType.Anchor3d
		) {
			continue;
		}
		if (!target.id) continue;
		const willOpen =
			target.mode === "open" ||
			(target.mode === "toggle" && !isOpen(target.id, target.name));
		if (willOpen && !ids.includes(target.id)) ids.push(target.id);
	}
	return ids;
}

/** 2D anchor ids whose panel should dock to the button that runs these actions. */
export function collectAnchor2dTriggerIds(
	actions: readonly unknown[],
): string[] {
	const ids: string[] = [];
	for (const target of collectSetContainerVisibilityTargets(actions)) {
		if (
			target.name === AppBuilderContainerNameType.Anchor2d &&
			target.id &&
			!ids.includes(target.id)
		) {
			ids.push(target.id);
		}
	}
	return ids;
}

/** Whether the sequence opens, closes, or toggles any 2D or 3D anchor by id. */
export function targetsAnchorContainer(actions: readonly unknown[]): boolean {
	return collectSetContainerVisibilityTargets(actions).some(
		(target) =>
			(target.name === AppBuilderContainerNameType.Anchor2d ||
				target.name === AppBuilderContainerNameType.Anchor3d) &&
			!!target.id,
	);
}
