jest.mock("@AppBuilderLib/entities/parameter/lib/parameterStates", () => ({
	getParameterStates: jest.fn(),
}));

import {
	loadWebmcpEvalScenarios,
	runWebmcpEvalScenario,
} from "../runWebmcpEvalScenarios";

describe("webmcp eval scenarios", () => {
	const scenarios = loadWebmcpEvalScenarios();

	it.each(scenarios)("$id: $description", async (scenario) => {
		const failure = await runWebmcpEvalScenario(scenario);

		expect(failure).toBeNull();
	});
});
