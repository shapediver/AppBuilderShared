import {defaultSettingsFor} from "@AppBuilderLib/features/agent-tools/config/inScopeGenericTools";
import {
	listParameterDefinitionsInputSchema,
	listParameterDefinitionsOutputSchema,
} from "@AppBuilderLib/features/agent-tools/config/listParameterDefinitions";
import {setParameterValuesInputSchema} from "@AppBuilderLib/features/agent-tools/config/setParameterValues";
import type {AgentToolsDeps} from "@AppBuilderLib/features/agent-tools/model/agentToolsDeps";
import {handleListParameterDefinitions} from "@AppBuilderLib/features/agent-tools/model/handlers/listParameterDefinitions";
import {handleSetParameterValues} from "@AppBuilderLib/features/agent-tools/model/handlers/setParameterValues";
import {GenericToolName} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {z} from "@AppBuilderLib/shared/lib/zod";
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

function createEvalDeps(): AgentToolsDeps {
	return {
		controllerNamespace: EVAL_NAMESPACE,
		getLiveParameters: (ns) => (ns === EVAL_NAMESPACE ? allParameters : []),
		listSessionNamespaces: () => [EVAL_NAMESPACE],
		getAppBuilder: () => undefined,
		batchParameterValueUpdate: async () => undefined,
		getDefaultToolbarActions: () => [],
		createModelState: async () => ({success: true}),
		importModelState: async () => ({success: true}),
		undo: async () => ({success: true}),
		redo: async () => ({success: true}),
		resetParameters: async () => ({success: true}),
		getViewportId: () => "vp",
		setCamera: async () => ({success: true}),
		getScreenshot: async () => undefined,
		getOutputByName: () => undefined,
	};
}

async function runListScenario(input: Record<string, unknown>) {
	return handleListParameterDefinitions(
		input,
		defaultSettingsFor(GenericToolName.ListParameterDefinitions),
		createEvalDeps(),
	);
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

async function assertListScenario(
	scenario: EvalScenario,
): Promise<string | null> {
	if (scenario.expect.inputSchemaReject) {
		return assertInputSchemaReject(
			listParameterDefinitionsInputSchema,
			scenario.input,
		);
	}

	const result = await runListScenario(scenario.input);
	const parsed = listParameterDefinitionsOutputSchema.safeParse(result);

	if (!parsed.success) {
		return "list output did not match schema";
	}

	const parameters = parsed.data.parameters;
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

	const result = await handleSetParameterValues(
		scenario.input,
		createEvalDeps(),
	);

	return assertSetErrorExpectations(result, scenario.expect);
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
		default:
			return `unknown tool "${scenario.tool}"`;
	}
}
