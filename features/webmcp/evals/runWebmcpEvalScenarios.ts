import {z} from "@AppBuilderLib/shared/lib/zod";
import {createModelStateInputSchema} from "../config/createModelState";
import {importModelStateInputSchema} from "../config/importModelState";
import {
	listParameterDefinitionsInputSchema,
	listParameterDefinitionsOutputSchema,
} from "../config/listParameterDefinitions";
import {listSessionsInputSchema} from "../config/listSessions";
import {setParameterValuesInputSchema} from "../config/setParameterValues";
import {mapParameterDefinition} from "../lib/parameterDefinitionMapper";
import {resolveAndUpdate} from "../lib/resolveSetParameterUpdates";
import {
	runTool,
	toolError,
	toolSuccess,
	type ToolResponse,
} from "../lib/toolResponse";
import {allParameters, EVAL_NAMESPACE} from "./__fixtures__/parameters";
import evalScenariosJson from "./evals.json";

export interface EvalExpect {
	applied?: string[];
	errors?: Array<{name: string; message: string}>;
	success?: boolean;
	parametersCount?: number;
	parameterIds?: string[];
	errorsNonEmpty?: boolean;
	appliedExcludes?: string[];
	errorMessageIncludes?: string;
	errorMessageIncludesAll?: string[];
	errorCount?: number;
	inputSchemaReject?: boolean;
	isError?: boolean;
	sessionsCount?: number;
	sessionIds?: string[];
	howtoPresent?: boolean;
	contentIncludes?: string;
}

export interface EvalScenario {
	id: string;
	tool: string;
	description: string;
	input: Record<string, unknown>;
	expect: EvalExpect;
}

export function loadWebmcpEvalScenarios(): EvalScenario[] {
	return evalScenariosJson as EvalScenario[];
}

const EVAL_NAMESPACES = [EVAL_NAMESPACE];

function runListScenario(
	input: Record<string, unknown>,
): Promise<ToolResponse> {
	return runTool(listParameterDefinitionsInputSchema, input, (parsed) => {
		const filter = parsed.filter ?? "all";
		const namespaces = EVAL_NAMESPACES;

		if (
			parsed.sessionId !== undefined &&
			!namespaces.includes(parsed.sessionId)
		) {
			return toolError(
				`Error: Session "${parsed.sessionId}" does not exist.\nRecovery: Use list_sessions or avoid specifying sessionId to list parameter definitions for all sessions.`,
			);
		}

		const targetNamespaces =
			parsed.sessionId !== undefined ? [parsed.sessionId] : namespaces;

		const parameters = targetNamespaces.flatMap((sessionId) => {
			let params = sessionId === EVAL_NAMESPACE ? allParameters : [];
			if (filter === "visible") {
				params = params.filter((p) => !p.definition.hidden);
			}
			return params.map((param) =>
				mapParameterDefinition(param, sessionId),
			);
		});

		return toolSuccess(
			`Found ${parameters.length} parameter definitions for ${targetNamespaces.length} sessions. Use set_parameter_values to update the state of parameters.`,
			{parameters},
		);
	});
}

function runListSessionsScenario(
	input: Record<string, unknown>,
): Promise<ToolResponse> {
	return runTool(listSessionsInputSchema, input, () => {
		const sessions = EVAL_NAMESPACES.map((sessionId) => ({sessionId}));
		return toolSuccess(
			`Found ${sessions.length} sessions. Next you can use one of the sessionIds with list_parameter_definitions.`,
			{sessions},
		);
	});
}

function assertInputSchemaReject(
	schema: z.ZodType,
	input: Record<string, unknown>,
): string | null {
	try {
		schema.parse(input);

		return "expected input schema validation to fail";
	} catch {
		return null;
	}
}

function getStructuredErrors(
	result: ToolResponse,
): Array<{name: string; message: string}> {
	const errors = result.structuredContent?.errors;
	return Array.isArray(errors)
		? (errors as Array<{name: string; message: string}>)
		: [];
}

function getStructuredApplied(result: ToolResponse): string[] {
	const applied = result.structuredContent?.applied;
	return Array.isArray(applied) ? (applied as string[]) : [];
}

function assertSetErrorExpectations(
	result: ToolResponse,
	expect: EvalExpect,
): string | null {
	const applied = getStructuredApplied(result);
	const errors = getStructuredErrors(result);

	if (expect.isError === true && result.isError !== true) {
		return "expected isError true";
	}
	if (expect.isError === false && result.isError === true) {
		return "expected isError not set";
	}

	if (expect.applied !== undefined) {
		const appliedSorted = [...applied].sort();
		const expectedSorted = [...expect.applied].sort();

		if (JSON.stringify(appliedSorted) !== JSON.stringify(expectedSorted)) {
			return `expected applied ${JSON.stringify(expect.applied)}, got ${JSON.stringify(applied)}`;
		}
	}

	if (expect.appliedExcludes !== undefined) {
		for (const id of expect.appliedExcludes) {
			if (applied.includes(id)) {
				return `expected applied to exclude "${id}"`;
			}
		}
	}

	if (expect.errors !== undefined) {
		if (JSON.stringify(errors) !== JSON.stringify(expect.errors)) {
			return `expected errors ${JSON.stringify(expect.errors)}, got ${JSON.stringify(errors)}`;
		}
	}

	if (expect.errorsNonEmpty && errors.length === 0) {
		return "expected non-empty errors array";
	}

	if (
		expect.errorCount !== undefined &&
		errors.length !== expect.errorCount
	) {
		return `expected ${expect.errorCount} error(s), got ${errors.length}`;
	}

	if (expect.errorMessageIncludes !== undefined) {
		const found = errors.some((error) =>
			error.message.includes(expect.errorMessageIncludes!),
		);

		if (!found) {
			return `expected an error message containing "${expect.errorMessageIncludes}"`;
		}
	}

	if (expect.errorMessageIncludesAll !== undefined) {
		for (const fragment of expect.errorMessageIncludesAll) {
			const found = errors.some((error) =>
				error.message.includes(fragment),
			);

			if (!found) {
				return `expected an error message containing "${fragment}"`;
			}
		}
	}

	if (expect.contentIncludes !== undefined) {
		const text = result.content.map((c) => c.text).join("\n");
		if (!text.includes(expect.contentIncludes)) {
			return `expected content to include "${expect.contentIncludes}"`;
		}
	}

	return null;
}

async function assertListScenario(
	scenario: EvalScenario,
): Promise<string | null> {
	const result = await runListScenario(scenario.input);
	const {expect} = scenario;

	if (expect.inputSchemaReject) {
		const parsed = listParameterDefinitionsOutputSchema.safeParse(result);

		if (!parsed.success) {
			return "list output did not match envelope schema after input rejection";
		}

		if (result.isError !== true) {
			return "expected isError true for invalid input";
		}

		if (!Array.isArray(result.structuredContent?.error)) {
			return "expected structuredContent.error to be zod issues array";
		}

		return null;
	}

	if (expect.isError === true) {
		if (result.isError !== true) {
			return "expected isError true";
		}
		if (expect.contentIncludes !== undefined) {
			const text = result.content.map((c) => c.text).join("\n");
			if (!text.includes(expect.contentIncludes)) {
				return `expected content to include "${expect.contentIncludes}"`;
			}
		}
		return null;
	}

	const parameters = Array.isArray(result.structuredContent?.parameters)
		? (result.structuredContent!.parameters as Array<{
				id: string;
				sessionId: string;
				howto: string;
			}>)
		: [];

	if (
		expect.parametersCount !== undefined &&
		parameters.length !== expect.parametersCount
	) {
		return `expected ${expect.parametersCount} parameters, got ${parameters.length}`;
	}

	if (expect.parameterIds !== undefined) {
		const ids = parameters.map((p) => p.id).sort();
		const expected = [...expect.parameterIds].sort();

		if (JSON.stringify(ids) !== JSON.stringify(expected)) {
			return `expected parameter ids ${JSON.stringify(expected)}, got ${JSON.stringify(ids)}`;
		}
	}

	if (expect.howtoPresent) {
		const missing = parameters.filter(
			(p) => typeof p.howto !== "string" || p.howto.length === 0,
		);
		if (missing.length > 0) {
			return `expected howto on all parameters; missing for ${missing.map((p) => p.id).join(", ")}`;
		}
	}

	if (expect.contentIncludes !== undefined) {
		const text = result.content.map((c) => c.text).join("\n");
		if (!text.includes(expect.contentIncludes)) {
			return `expected content to include "${expect.contentIncludes}"`;
		}
	}

	return null;
}

async function assertListSessionsScenario(
	scenario: EvalScenario,
): Promise<string | null> {
	const result = await runListSessionsScenario(scenario.input);
	const {expect} = scenario;

	if (result.isError) {
		return "list_sessions unexpectedly failed";
	}

	const sessions = Array.isArray(result.structuredContent?.sessions)
		? (result.structuredContent!.sessions as Array<{sessionId: string}>)
		: [];

	if (
		expect.sessionsCount !== undefined &&
		sessions.length !== expect.sessionsCount
	) {
		return `expected ${expect.sessionsCount} sessions, got ${sessions.length}`;
	}

	if (expect.sessionIds !== undefined) {
		const ids = sessions.map((s) => s.sessionId).sort();
		const expected = [...expect.sessionIds].sort();
		if (JSON.stringify(ids) !== JSON.stringify(expected)) {
			return `expected session ids ${JSON.stringify(expected)}, got ${JSON.stringify(ids)}`;
		}
	}

	if (expect.contentIncludes !== undefined) {
		const text = result.content.map((c) => c.text).join("\n");
		if (!text.includes(expect.contentIncludes)) {
			return `expected content to include "${expect.contentIncludes}"`;
		}
	}

	return null;
}

async function assertSetScenario(
	scenario: EvalScenario,
): Promise<string | null> {
	if (scenario.expect.inputSchemaReject) {
		return assertInputSchemaReject(
			setParameterValuesInputSchema,
			scenario.input,
		);
	}

	const result = await runTool(
		setParameterValuesInputSchema,
		scenario.input,
		async (parsed) => {
			const updateResult = await resolveAndUpdate(
				EVAL_NAMESPACE,
				(ns) => (ns === EVAL_NAMESPACE ? allParameters : []),
				parsed.updates,
				async () => undefined,
			);
			const totalFailure =
				updateResult.applied.length === 0 &&
				updateResult.errors.length > 0;
			const errorCount = updateResult.errors.length;
			const text =
				errorCount === 0
					? `Applied ${updateResult.applied.length} of ${parsed.updates.length} updates.`
					: `Applied ${updateResult.applied.length} of ${parsed.updates.length} updates. ${errorCount} failed.`;
			const payload = {
				applied: updateResult.applied,
				errors: updateResult.errors,
			};
			return totalFailure
				? toolError(text, payload)
				: toolSuccess(text, payload);
		},
	);

	return assertSetErrorExpectations(result, scenario.expect);
}

// TODO SS-9745: full create/import evals require a browser WebMCP runtime.
function assertSchemaScenario(scenario: EvalScenario): string | null {
	const {tool, input, expect} = scenario;
	const schema =
		tool === "create_model_state"
			? createModelStateInputSchema
			: tool === "import_model_state"
				? importModelStateInputSchema
				: undefined;

	if (!schema) {
		return `unknown schema tool "${tool}"`;
	}

	if (expect.inputSchemaReject || expect.success === false) {
		return assertInputSchemaReject(schema, input);
	}

	try {
		schema.parse(input);
	} catch (e) {
		return e instanceof Error ? e.message : String(e);
	}

	return null;
}

/** Returns failure reason, or null when the scenario passes. */
export async function runWebmcpEvalScenario(
	scenario: EvalScenario,
): Promise<string | null> {
	switch (scenario.tool) {
		case "list_sessions":
			return assertListSessionsScenario(scenario);
		case "list_parameter_definitions":
			return assertListScenario(scenario);
		case "set_parameter_values":
			return assertSetScenario(scenario);
		case "create_model_state":
		case "import_model_state":
			return assertSchemaScenario(scenario);
		default:
			return `unknown tool "${scenario.tool}"`;
	}
}
