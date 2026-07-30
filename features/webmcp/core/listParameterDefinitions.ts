import {z} from "@AppBuilderLib/shared/lib/zod";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {ChoiceMetadata} from "./deps";
import {mapParameterDefinition} from "../lib/parameterDefinitionMapper";
import type {ToolDef} from "./toolDefinition";

const colorValueSchema = z.object({
	red: z.number(),
	green: z.number(),
	blue: z.number(),
	alpha: z.number(),
});

export const parameterValueSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	colorValueSchema,
]);

const choiceMetadataValueSchema = z.object({
	description: z.string().optional(),
	displayname: z.string().optional(),
	imageUrl: z.string().optional(),
});

const ListParameterDefinitionItemSchema = z.object({
	id: z.string(),
	sessionId: z.string(),
	name: z.string(),
	displayname: z.string().optional(),
	type: z.string(),
	howto: z.string(),
	group: z.string().optional(),
	tooltip: z.string().optional(),
	min: z.number().nullable().optional(),
	max: z.number().nullable().optional(),
	decimalplaces: z.number().nullable().optional(),
	choices: z.array(z.string()).optional(),
	choiceMetadata: z.record(z.string(), choiceMetadataValueSchema).optional(),
	currentValue: parameterValueSchema.optional(),
	defaultValue: parameterValueSchema.optional(),
	hidden: z.boolean().optional(),
	settable: z.boolean(),
});

export const listParameterDefinitionsInputSchema = z.strictObject({
	filter: z
		.enum(["all", "visible"])
		.optional()
		.describe(
			"all = every parameter; visible = parameters not hidden by the model (definition.hidden === false). Defaults to all.",
		),
	sessionId: z
		.string()
		.optional()
		.describe(
			"Optional session namespace. Omit to list parameter definitions for all sessions.",
		),
	search: z
		.string()
		.optional()
		.describe(
			"Case-insensitive substring filter over parameter id, name, and displayname. Omit to return all.",
		),
	limit: z
		.number()
		.int()
		.positive()
		.max(100)
		.optional()
		.describe(
			"Cap on number of parameters returned per page. Default 20. If more match beyond this page, structuredContent.truncated is true.",
		),
	offset: z
		.number()
		.int()
		.min(0)
		.optional()
		.describe(
			"Number of matching parameters to skip before the returned page (0-based). Default 0. Use with limit to paginate truncated results.",
		),
});

export const listParameterDefinitionsOutputSchema = z.object({
	parameters: z.array(ListParameterDefinitionItemSchema),
	truncated: z.boolean().optional(),
	sessionCount: z.number().int(),
	offset: z.number().int(),
	remaining: z.number().int().optional(),
	nextOffset: z.number().int().optional(),
});

export type ListParameterDefinitionItem = z.infer<
	typeof ListParameterDefinitionItemSchema
>;
export type ListParameterDefinitionsOutput = z.infer<
	typeof listParameterDefinitionsOutputSchema
>;

export const SUPPORTED_PARAMETER_TYPES: ResParameterType[] = [
	ResParameterType.BOOL,
	ResParameterType.COLOR,
	ResParameterType.EVEN,
	ResParameterType.FLOAT,
	ResParameterType.INT,
	ResParameterType.ODD,
	ResParameterType.STRING,
	ResParameterType.STRINGLIST,
];

const DEFAULT_LIMIT = 20;

function matchesSearch(
	definition: {id: string; name: string; displayname?: string},
	search: string,
): boolean {
	const needle = search.toLowerCase();
	return (
		definition.id.toLowerCase().includes(needle) ||
		definition.name.toLowerCase().includes(needle) ||
		(definition.displayname?.toLowerCase().includes(needle) ?? false)
	);
}

export const listParameterDefinitionsTool: ToolDef<
	z.infer<typeof listParameterDefinitionsInputSchema>,
	ListParameterDefinitionsOutput
> = {
	name: "list_parameter_definitions",
	description:
		"Get definitions of parameters whose values can be updated to change the state of the 3D configurator. " +
		"Optional filter (all | visible), search (case-insensitive substring over id/name/displayname), limit (default 20, max 100), offset (default 0, for pagination), and sessionId; omit sessionId to list all sessions. " +
		"Only filter, sessionId, search, limit, offset are accepted as input — do NOT send group, sort, or any other key; the schema rejects unknown keys. " +
		'Prefer narrow `search` and a small `limit` over fetching all parameters — use search whenever you know a parameter name fragment or a target keyword (e.g. search="prong", search="metal", search="stone"). ' +
		"Only call with filter=all and no search when you must enumerate every parameter (e.g. reset, audit, or unknown target); paginate with offset+limit if needed. " +
		"When results are truncated (structuredContent.truncated=true), fetch the next page with offset=offset+limit, or refine search to narrow. " +
		"Each parameter has a `howto` field stating the exact value format set_parameter_values expects. " +
		"Trust `type` over the display name (e.g. a parameter named Color may still be StringList). " +
		"`settable=false` means read-only via set_parameter_values (unsupported type).",
	inputSchema: listParameterDefinitionsInputSchema,
	outputSchema: listParameterDefinitionsOutputSchema,
	annotations: {readOnlyHint: true, untrustedContentHint: true},
	execute: async (deps, parsed, _signal) => {
		const filter = parsed.filter ?? "all";
		const namespaces = deps.listParameterNamespaces();

		if (
			parsed.sessionId !== undefined &&
			!namespaces.includes(parsed.sessionId)
		) {
			throw new Error(
				`Error: Session "${parsed.sessionId}" does not exist.\nRecovery: Use list_sessions or avoid specifying sessionId to list parameter definitions for all sessions.`,
			);
		}

		const targetNamespaces =
			parsed.sessionId !== undefined ? [parsed.sessionId] : namespaces;

		const search = parsed.search?.trim();
		const parameters = targetNamespaces.flatMap((sessionId) => {
			let params = deps.getLiveParameters(sessionId);
			if (filter === "visible") {
				params = params.filter((p) => !p.definition.hidden);
			}
			if (search) {
				params = params.filter((p) =>
					matchesSearch(p.definition, search),
				);
			}
			return params.map((param) => {
				const choiceMetadata = deps.getChoiceMetadata?.(
					sessionId,
					param.definition,
				) as Record<string, ChoiceMetadata> | undefined;
				return mapParameterDefinition(param, sessionId, choiceMetadata);
			});
		});

		const limit = parsed.limit ?? DEFAULT_LIMIT;
		const offset = parsed.offset ?? 0;
		const total = parameters.length;
		const page = parameters.slice(offset, offset + limit);
		const truncated = offset + limit < total;

		if (truncated) {
			return {
				parameters: page,
				truncated: true,
				sessionCount: targetNamespaces.length,
				offset,
				remaining: total - offset - page.length,
				nextOffset: offset + limit,
			};
		}

		return {
			parameters: page,
			sessionCount: targetNamespaces.length,
			offset,
		};
	},
	format: (output) => {
		const n = output.parameters.length;
		if (output.truncated) {
			return `Found ${n} parameter definitions for ${output.sessionCount} sessions (page starting at offset ${output.offset}; ${output.remaining} more remain). Use set_parameter_values to update the state of parameters. More parameters match beyond this page. Raise offset (e.g. offset=${output.nextOffset}) or narrow your search.`;
		}
		return `Found ${n} parameter definitions for ${output.sessionCount} sessions. Use set_parameter_values to update the state of parameters.`;
	},
};
