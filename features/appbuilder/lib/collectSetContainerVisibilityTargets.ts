import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionType";

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
