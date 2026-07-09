export interface ParameterValueSnapshot {
	definition: {id: string};
	state: {uiValue: unknown};
}

/**
 * Returns parameter ids whose uiValue changed between before and after snapshots.
 */
export function computeAppliedParameterIds(
	beforeValues: Map<string, unknown>,
	afterParams: ParameterValueSnapshot[],
): string[] {
	return afterParams
		.filter((p) => beforeValues.get(p.definition.id) !== p.state.uiValue)
		.map((p) => p.definition.id);
}
