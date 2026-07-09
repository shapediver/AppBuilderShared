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
 * Parameters shown in accordion widgets. When layout has no accordion refs,
 * returns all parameters (no custom UI layout to filter against).
 */
export function filterVisibleParameters(
	parameters: IShapeDiverParameter<any>[],
	refs: IAppBuilderParameterRef[],
): IShapeDiverParameter<any>[] {
	if (refs.length === 0) {
		return parameters;
	}

	return parameters.filter((param) => parameterMatchesRef(param, refs));
}
