import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {IAppBuilderParameterRef} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

function parameterMatchesRef(
	param: IShapeDiverParameter<any>,
	refs: IAppBuilderParameterRef[],
): boolean {
	const def = param.definition;

	return refs.some(
		(ref) =>
			ref.name === def.id ||
			ref.name === def.name ||
			(!!def.displayname && ref.name === def.displayname),
	);
}

/**
 * Parameters placed in the configurator UI (accordion, form, controls widgets).
 * When layout has no parameter refs, returns empty — visible means UI-placed only.
 */
export function filterVisibleParameters(
	parameters: IShapeDiverParameter<any>[],
	refs: IAppBuilderParameterRef[],
): IShapeDiverParameter<any>[] {
	if (refs.length === 0) {
		return [];
	}

	return parameters.filter((param) => parameterMatchesRef(param, refs));
}
