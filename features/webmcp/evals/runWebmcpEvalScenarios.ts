import {ZodError} from "@AppBuilderLib/shared/lib/zod";
import type {ToolDeps} from "../core/deps";
import {ToolExecutionError, type AnyToolDef} from "../core/toolDefinition";
import {ALL_TOOLS} from "../core/tools";
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
	truncated?: boolean;
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

const evalDeps: ToolDeps = {
	namespace: EVAL_NAMESPACE,
	getLiveParameters: (ns) => (ns === EVAL_NAMESPACE ? allParameters : []),
	listParameterNamespaces: () => EVAL_NAMESPACES,
	batchParameterValueUpdate: async () => undefined,
	createModelState: async () => ({}),
	importModelState: async () => ({
		success: false,
		message: "not implemented in evals",
	}),
};

type CoreToolResult =
	| {ok: true; structured: unknown; text: string}
	| {
			ok: false;
			message: string;
			structured?: Record<string, unknown>;
			zodIssues?: unknown;
	  };

async function runCoreTool(
	tool: AnyToolDef,
	deps: ToolDeps,
	input: Record<string, unknown>,
): Promise<CoreToolResult> {
	try {
		const parsed = tool.inputSchema.parse(input ?? {});
		try {
			const structured = await tool.execute(
				deps,
				parsed,
				new AbortController().signal,
			);
			return {ok: true, structured, text: tool.format(structured)};
		} catch (e) {
			if (e instanceof ToolExecutionError) {
				return {
					ok: false,
					message: e.message,
					structured: e.structuredContent,
				};
			}
			return {
				ok: false,
				message: e instanceof Error ? e.message : String(e),
			};
		}
	} catch (e) {
		if (e instanceof ZodError) {
			return {
				ok: false,
				message: "Invalid input data",
				zodIssues: e.issues,
			};
		}
		return {ok: false, message: e instanceof Error ? e.message : String(e)};
	}
}

function getTool(name: string): AnyToolDef | undefined {
	return ALL_TOOLS.find((t) => t.name === name);
}

function resultText(result: CoreToolResult): string {
	return result.ok ? result.text : result.message;
}

function getStructuredErrors(
	result: CoreToolResult,
): Array<{name: string; message: string}> {
	const structured = result.ok
		? (result.structured as Record<string, unknown> | undefined)
		: result.structured;
	const errors = structured?.errors;
	return Array.isArray(errors)
		? (errors as Array<{name: string; message: string}>)
		: [];
}

function getStructuredApplied(result: CoreToolResult): string[] {
	const structured = result.ok
		? (result.structured as Record<string, unknown> | undefined)
		: result.structured;
	const applied = structured?.applied;
	return Array.isArray(applied) ? (applied as string[]) : [];
}

function assertContentIncludes(
	result: CoreToolResult,
	contentIncludes: string,
): string | null {
	const text = resultText(result);
	if (!text.includes(contentIncludes)) {
		return `expected content to include "${contentIncludes}"`;
	}
	return null;
}

function assertSetErrorExpectations(
	result: CoreToolResult,
	expect: EvalExpect,
): string | null {
	const applied = getStructuredApplied(result);
	const errors = getStructuredErrors(result);

	if (expect.isError === true && result.ok !== false) {
		return "expected isError true";
	}
	if (expect.isError === false && result.ok === false) {
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
		return assertContentIncludes(result, expect.contentIncludes);
	}

	return null;
}

async function assertListScenario(
	scenario: EvalScenario,
	tool: AnyToolDef,
): Promise<string | null> {
	const result = await runCoreTool(tool, evalDeps, scenario.input);
	const {expect} = scenario;

	if (expect.inputSchemaReject) {
		if (result.ok || result.zodIssues === undefined) {
			return "expected input schema validation to fail with zodIssues";
		}
		return null;
	}

	if (expect.isError === true) {
		if (result.ok !== false) {
			return "expected isError true";
		}
		if (expect.contentIncludes !== undefined) {
			return assertContentIncludes(result, expect.contentIncludes);
		}
		return null;
	}

	if (!result.ok) {
		return `list_parameter_definitions unexpectedly failed: ${result.message}`;
	}

	const structured = result.structured as {
		parameters?: Array<{id: string; sessionId: string; howto: string}>;
		truncated?: boolean;
	};
	const parameters = Array.isArray(structured.parameters)
		? structured.parameters
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
		const contentFailure = assertContentIncludes(
			result,
			expect.contentIncludes,
		);
		if (contentFailure) {
			return contentFailure;
		}
	}

	if (expect.truncated === true) {
		if (structured.truncated !== true) {
			return "expected structured.truncated true";
		}
	}
	if (expect.truncated === false) {
		if (structured.truncated === true) {
			return "expected structured.truncated not set";
		}
	}

	return null;
}

async function assertListSessionsScenario(
	scenario: EvalScenario,
	tool: AnyToolDef,
): Promise<string | null> {
	const result = await runCoreTool(tool, evalDeps, scenario.input);
	const {expect} = scenario;

	if (!result.ok) {
		return "list_sessions unexpectedly failed";
	}

	const structured = result.structured as {
		sessions?: Array<{sessionId: string}>;
	};
	const sessions = Array.isArray(structured.sessions)
		? structured.sessions
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
		return assertContentIncludes(result, expect.contentIncludes);
	}

	return null;
}

async function assertSetScenario(
	scenario: EvalScenario,
	tool: AnyToolDef,
): Promise<string | null> {
	const result = await runCoreTool(tool, evalDeps, scenario.input);

	if (scenario.expect.inputSchemaReject) {
		if (result.ok || result.zodIssues === undefined) {
			return "expected input schema validation to fail with zodIssues";
		}
		return null;
	}

	return assertSetErrorExpectations(result, scenario.expect);
}

/**
 * Create/import evals are schema-only until a browser WebMCP runtime exists.
 * `expect.success` means input schema accept/reject, not tool output success.
 */
async function assertSchemaScenario(
	scenario: EvalScenario,
	tool: AnyToolDef,
): Promise<string | null> {
	const {input, expect} = scenario;
	const result = await runCoreTool(tool, evalDeps, input);

	if (expect.inputSchemaReject || expect.success === false) {
		if (result.ok || result.zodIssues === undefined) {
			return "expected input schema validation to fail";
		}
		return null;
	}

	if (!result.ok && result.zodIssues !== undefined) {
		return "expected input schema to accept";
	}

	return null;
}

/** Returns failure reason, or null when the scenario passes. */
export async function runWebmcpEvalScenario(
	scenario: EvalScenario,
): Promise<string | null> {
	const tool = getTool(scenario.tool);
	if (!tool) {
		return `unknown tool "${scenario.tool}"`;
	}

	switch (scenario.tool) {
		case "list_sessions":
			return assertListSessionsScenario(scenario, tool);
		case "list_parameter_definitions":
			return assertListScenario(scenario, tool);
		case "set_parameter_values":
			return assertSetScenario(scenario, tool);
		case "create_model_state":
		case "import_model_state":
			return assertSchemaScenario(scenario, tool);
		default:
			return `unknown tool "${scenario.tool}"`;
	}
}
