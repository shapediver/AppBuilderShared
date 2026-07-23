import {z} from "zod";
import {createModelStateInputSchema} from "../config/createModelState";
import {importModelStateInputSchema} from "../config/importModelState";
import {
	listParameterDefinitionsInputSchema,
	listParameterDefinitionsOutputSchema,
} from "../config/listParameterDefinitions";
import {setParameterValuesInputSchema} from "../config/setParameterValues";
import {formatToolInputError} from "../lib/formatToolInputError";
import {mapParameterDefinition} from "../lib/parameterDefinitionMapper";
import {resolveAndUpdate} from "../lib/resolveSetParameterUpdates";
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

function runListScenario(input: Record<string, unknown>) {
	try {
		const parsed = listParameterDefinitionsInputSchema.parse(input);
		const filter = parsed.filter ?? "all";
		let parameters = allParameters;

		if (filter === "visible") {
			parameters = parameters.filter((p) => !p.definition.hidden);
		}

		return {
			parameters: parameters.map((param) =>
				mapParameterDefinition(param),
			),
		};
	} catch (e) {
		return {
			parameters: [],
			...formatToolInputError(e),
		};
	}
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

function assertSetErrorExpectations(
	result: {applied: string[]; errors: Array<{name: string; message: string}>},
	expect: EvalExpect,
): string | null {
	if (expect.applied !== undefined) {
		const appliedSorted = [...result.applied].sort();
		const expectedSorted = [...expect.applied].sort();

		if (JSON.stringify(appliedSorted) !== JSON.stringify(expectedSorted)) {
			return `expected applied ${JSON.stringify(expect.applied)}, got ${JSON.stringify(result.applied)}`;
		}
	}

	if (expect.appliedExcludes !== undefined) {
		for (const id of expect.appliedExcludes) {
			if (result.applied.includes(id)) {
				return `expected applied to exclude "${id}"`;
			}
		}
	}

	if (expect.errors !== undefined) {
		if (JSON.stringify(result.errors) !== JSON.stringify(expect.errors)) {
			return `expected errors ${JSON.stringify(expect.errors)}, got ${JSON.stringify(result.errors)}`;
		}
	}

	if (expect.errorsNonEmpty && result.errors.length === 0) {
		return "expected non-empty errors array";
	}

	if (
		expect.errorCount !== undefined &&
		result.errors.length !== expect.errorCount
	) {
		return `expected ${expect.errorCount} error(s), got ${result.errors.length}`;
	}

	if (expect.errorMessageIncludes !== undefined) {
		const found = result.errors.some((error) =>
			error.message.includes(expect.errorMessageIncludes!),
		);

		if (!found) {
			return `expected an error message containing "${expect.errorMessageIncludes}"`;
		}
	}

	if (expect.errorMessageIncludesAll !== undefined) {
		for (const fragment of expect.errorMessageIncludesAll) {
			const found = result.errors.some((error) =>
				error.message.includes(fragment),
			);

			if (!found) {
				return `expected an error message containing "${fragment}"`;
			}
		}
	}

	return null;
}

function assertListScenario(scenario: EvalScenario): string | null {
	if (scenario.expect.inputSchemaReject) {
		const result = runListScenario(scenario.input);
		const parsed = listParameterDefinitionsOutputSchema.safeParse(result);

		if (!parsed.success) {
			return "list output did not match schema after input rejection";
		}

		if (!parsed.data.errors?.length) {
			return "expected non-empty errors array for invalid input";
		}

		return null;
	}

	const result = runListScenario(scenario.input);
	const parameters = result.parameters;
	const {expect} = scenario;

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

	const parsed = setParameterValuesInputSchema.parse(scenario.input);

	const result = await resolveAndUpdate(
		EVAL_NAMESPACE,
		(ns) => (ns === EVAL_NAMESPACE ? allParameters : []),
		parsed.updates,
		async () => undefined,
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
