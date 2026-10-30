import {resolveParameterValueSources} from "@AppBuilderLib/entities/parameter/lib/resolveParameterValueSources";
import {IAppBuilderActionPropsSetParameterValue} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/**
 * Resolve the `parameterValues` of an export reference into the values passed
 * to the export request, keyed by parameter name.
 *
 * A literal value wins over a source. Sources are resolved in the session
 * given by `parameter.sessionId`, or in `namespace`. Empty values are left
 * out, so the session's current value is used for them.
 */
export async function resolveExportParameterValues(
	parameterValues: IAppBuilderActionPropsSetParameterValue[] | undefined,
	namespace: string,
): Promise<{[key: string]: string} | undefined> {
	if (!parameterValues || parameterValues.length === 0) return undefined;

	const withSource = parameterValues.filter((p) => !p.value && p.source);
	const resolvedSources =
		withSource.length > 0
			? await resolveParameterValueSources(
					withSource.map((p) => ({
						id: p.parameter.name,
						value: p.source!,
						namespace: p.parameter.sessionId,
					})),
					{namespace},
				)
			: undefined;

	const result: {[key: string]: string} = {};
	let sourceIndex = 0;
	for (const p of parameterValues) {
		if (p.value) {
			result[p.parameter.name] = p.value;
		} else if (p.source) {
			const resolved = resolvedSources?.[sourceIndex++];
			if (resolved) result[p.parameter.name] = resolved;
		}
	}

	return result;
}
