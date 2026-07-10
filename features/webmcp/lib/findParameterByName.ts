import {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";

export function findParameterByName(
	parameters: IShapeDiverParameter<any>[],
	name: string,
): IShapeDiverParameter<any> | undefined {
	return parameters.find(
		(p) =>
			p.definition.id === name ||
			p.definition.name === name ||
			p.definition.displayname === name,
	);
}
