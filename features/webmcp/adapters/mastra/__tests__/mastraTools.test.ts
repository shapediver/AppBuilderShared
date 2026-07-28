jest.mock("@mastra/core/tools", () => ({
	createTool: jest.fn((def) => def),
}));

jest.mock("@AppBuilderLib/entities/parameter/lib/parameterStates", () => ({
	getParameterStates: jest.fn(() => []),
}));

jest.mock("../../../lib/computeAppliedParameterIds", () => ({
	computeAppliedParameterIds: jest.fn(),
}));

import {createTool} from "@mastra/core/tools";
import type {ToolDeps} from "../../core/deps";
import {buildMastraTools} from "../mastraTools";

describe("buildMastraTools", () => {
	it("returns a map with five tools and wires toModelOutput to format", () => {
		const deps: ToolDeps = {
			namespace: "main",
			getLiveParameters: () => [],
			listParameterNamespaces: () => ["main"],
			batchParameterValueUpdate: jest.fn(),
			createModelState: jest.fn(),
			importModelState: jest.fn(),
		};
		const tools = buildMastraTools(deps);
		expect(Object.keys(tools).sort()).toEqual(
			[
				"create_model_state",
				"import_model_state",
				"list_parameter_definitions",
				"list_sessions",
				"set_parameter_values",
			].sort(),
		);
		expect(createTool).toHaveBeenCalledTimes(5);

		const listSessions = tools["list_sessions"] as {
			id: string;
			toModelOutput: (o: {sessions: Array<{sessionId: string}>}) => {
				type: string;
				value: Array<{type: string; text: string}>;
			};
		};
		expect(listSessions.id).toBe("list_sessions");
		const modelOut = listSessions.toModelOutput({
			sessions: [{sessionId: "main"}],
		});
		expect(modelOut.value[0].text).toContain("Found 1 sessions");
	});
});
