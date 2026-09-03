export interface ParameterValueSnapshot {
	definition: {id: string};
	state: {execValue: unknown};
}

/**
 * Returns parameter ids whose executed value changed between before and after snapshots.
 * (The ui value may not change, e.g. for parameters which are reset after each execution.)
 */
export function computeAppliedParameterIds(
	beforeValues: Map<string, unknown>,
	afterParams: ParameterValueSnapshot[],
): string[] {
	return afterParams
		.filter((p) => beforeValues.get(p.definition.id) !== p.state.execValue)
		.map((p) => p.definition.id);
}
