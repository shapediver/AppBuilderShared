import {z} from "@AppBuilderLib/shared/lib/zod";

/** JSON Schema subset accepted by WebMCP `registerTool({ inputSchema })`. */
export type JsonSchema = {
	type?: string;
	description?: string;
	properties?: Record<string, JsonSchema>;
	required?: string[];
	items?: JsonSchema;
	enum?: (string | number | boolean)[];
	anyOf?: JsonSchema[];
	additionalProperties?: JsonSchema | boolean;
	const?: string | number | boolean;
};

/** Zod 4 internal definition shape (not public API). */
type ZodDef = {
	type: string;
	shape?: Record<string, z.ZodType>;
	innerType?: z.ZodType;
	options?: z.ZodType[];
	element?: z.ZodType;
	entries?: Record<string, string>;
	values?: (string | number | boolean)[];
	valueType?: z.ZodType;
};

const PRIMITIVE_TYPES = new Set(["string", "number", "boolean"]);

function getDef(schema: z.ZodType): ZodDef {
	return (schema as z.ZodType & {_zod: {def: ZodDef}})._zod.def;
}

/** Peel `.optional()` so required[] on parent object stays correct. */
function unwrapOptional(schema: z.ZodType): {
	schema: z.ZodType;
	optional: boolean;
} {
	const def = getDef(schema);
	if (def.type === "optional" && def.innerType) {
		return {schema: def.innerType, optional: true};
	}

	return {schema, optional: false};
}

function withDescription(
	schema: z.ZodType,
	jsonSchema: JsonSchema,
): JsonSchema {
	if (schema.description) {
		jsonSchema.description = schema.description;
	}

	return jsonSchema;
}

function literalSchema(value: unknown): JsonSchema {
	if (typeof value === "string") {
		return {type: "string", const: value};
	}
	if (typeof value === "number") {
		return {type: "number", const: value};
	}
	if (typeof value === "boolean") {
		return {type: "boolean", const: value};
	}

	return {const: value as string | number | boolean};
}

/** Builds strict object schema; nested objects also get additionalProperties: false. */
function objectSchema(
	shape: Record<string, z.ZodType>,
	schema?: z.ZodType,
): JsonSchema {
	const properties: Record<string, JsonSchema> = {};
	const required: string[] = [];

	for (const [key, fieldSchema] of Object.entries(shape)) {
		const {schema: inner, optional} = unwrapOptional(fieldSchema);
		properties[key] = zodToJsonSchema(inner);
		if (!optional) {
			required.push(key);
		}
	}

	const result: JsonSchema = {
		type: "object",
		properties,
		additionalProperties: false,
	};
	if (required.length > 0) {
		result.required = required;
	}

	return schema ? withDescription(schema, result) : result;
}

/**
 * Converts a Zod schema to JSON Schema for WebMCP and ToolsApi tool listing.
 *
 * Intentionally small: only handles Zod types used by `features/agent-tools/config`
 * (`strictObject`, primitives, enum, union, array, record, literal).
 * Every object node sets `additionalProperties: false` so weak models cannot
 * invent extra keys (`parameters`, `visibleOnly`, etc.).
 */
export function zodToJsonSchema(schema: z.ZodType): JsonSchema {
	const def = getDef(schema);

	if (PRIMITIVE_TYPES.has(def.type)) {
		return withDescription(schema, {type: def.type});
	}

	switch (def.type) {
		case "any":
			return {};
		case "enum":
			return withDescription(schema, {
				type: "string",
				enum: Object.values(def.entries ?? {}),
			});
		case "literal":
			return literalSchema(def.values?.[0]);
		case "array":
			return {
				type: "array",
				items: def.element ? zodToJsonSchema(def.element) : {},
			};
		case "object":
			return objectSchema(def.shape ?? {}, schema);
		case "union":
			return {
				anyOf: (def.options ?? []).map(zodToJsonSchema),
			};
		case "record":
			return {
				type: "object",
				additionalProperties: def.valueType
					? zodToJsonSchema(def.valueType)
					: true,
			};
		case "optional":
			return def.innerType ? zodToJsonSchema(def.innerType) : {};
		default:
			throw new Error(`Unsupported Zod type: ${def.type}`);
	}
}
