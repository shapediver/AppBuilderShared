import {applyOverrides} from "@AppBuilderLib/lib/mergeOverrides";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {IShapeDiverParameterDefinition} from "../config/parameter";
import type {PropsParameter} from "../config/propsParameter";

/**
 * Apply the overrides of a parameter reference to its definition.
 *
 * `decimalplaces` may only reduce the decimal places of a "Float" parameter:
 * values are sent with the decimal places of the model, so further places
 * would never reach the computation, and the other numeric types have none.
 * An override which does not reduce them is ignored.
 */
export function applyParameterOverrides(
	definition: IShapeDiverParameterDefinition,
	overrides: PropsParameter["overrides"],
): IShapeDiverParameterDefinition {
	const result = applyOverrides(definition, overrides);
	const requested = overrides?.decimalplaces;
	if (requested === undefined || requested === null) return result;
	const model = definition.decimalplaces;
	const reduces =
		definition.type === ResParameterType.FLOAT &&
		typeof model === "number" &&
		Number.isInteger(requested) &&
		requested >= 0 &&
		requested < model;
	return reduces ? result : {...result, decimalplaces: model};
}
