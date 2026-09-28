import type {JsonValue} from "@AppBuilderLib/features/appbuilder/config/jsonValue";
import {z, type ZodType} from "@AppBuilderLib/shared/lib/zod";

const compiled = new WeakMap<object, ZodType>();

function schemaError(error: unknown): string {
	return error instanceof Error ? error.message : "inputSchema is invalid";
}

function inputError(
	error: {path: PropertyKey[]; message: string} | undefined,
): string {
	if (!error) return "input does not match inputSchema";
	const at = error.path.length > 0 ? ` at /${error.path.join("/")}` : "";
	return `input does not match inputSchema${at}: ${error.message}`;
}

/** `undefined` when `input` matches the author schema. */
export function validateToolInput(
	schema: Record<string, JsonValue>,
	input: unknown,
): string | undefined {
	let validate = compiled.get(schema);
	if (!validate) {
		try {
			validate = z.fromJSONSchema(schema);
		} catch (error) {
			return schemaError(error);
		}
		compiled.set(schema, validate);
	}
	const result = validate.safeParse(input);
	if (result.success) return undefined;
	return inputError(result.error.issues[0]);
}
