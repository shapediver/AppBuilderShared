import {z} from "zod";

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

type ZodDef = {
	type: string;
	shape?: Record<string, z.ZodType>;
	innerType?: z.ZodType;
	options?: z.ZodType[];
	element?: z.ZodType;
	entries?: Record<string, string>;
	values?: (string | number | boolean)[];
	keyType?: z.ZodType;
	valueType?: z.ZodType;
};

function getDef(schema: z.ZodType): ZodDef {
	return (schema as z.ZodType & {_zod: {def: ZodDef}})._zod.def;
}

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

function zodToJsonSchemaInner(schema: z.ZodType): JsonSchema {
	const def = getDef(schema);

	switch (def.type) {
		case "string":
			return withDescription(schema, {type: "string"});
		case "number":
			return withDescription(schema, {type: "number"});
		case "boolean":
			return withDescription(schema, {type: "boolean"});
		case "any":
			return {};
		case "enum":
			return withDescription(schema, {
				type: "string",
				enum: Object.values(def.entries ?? {}),
			});
		case "literal": {
			const value = def.values?.[0];
			if (typeof value === "string") {
				return {type: "string", const: value};
			}
			if (typeof value === "number") {
				return {type: "number", const: value};
			}
			if (typeof value === "boolean") {
				return {type: "boolean", const: value};
			}

			return {const: value};
		}
		case "array":
			return {
				type: "array",
				items: def.element ? zodToJsonSchemaInner(def.element) : {},
			};
		case "object": {
			const properties: Record<string, JsonSchema> = {};
			const required: string[] = [];

			for (const [key, value] of Object.entries(def.shape ?? {})) {
				const {schema: inner, optional} = unwrapOptional(value);
				properties[key] = zodToJsonSchemaInner(inner);
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

			return withDescription(schema, result);
		}
		case "union":
			return {
				anyOf: (def.options ?? []).map((option) =>
					zodToJsonSchemaInner(option),
				),
			};
		case "record":
			return {
				type: "object",
				additionalProperties: def.valueType
					? zodToJsonSchemaInner(def.valueType)
					: true,
			};
		case "optional":
			return def.innerType ? zodToJsonSchemaInner(def.innerType) : {};
		default:
			throw new Error(`Unsupported Zod type: ${def.type}`);
	}
}

export function zodToJsonSchema(schema: z.ZodType): JsonSchema {
	return zodToJsonSchemaInner(schema);
}
