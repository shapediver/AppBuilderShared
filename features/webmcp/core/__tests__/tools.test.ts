jest.mock("@AppBuilderLib/entities/parameter/lib/parameterStates", () => ({
	getParameterStates: jest.fn(),
}));

jest.mock("../../lib/computeAppliedParameterIds", () => ({
	computeAppliedParameterIds: jest.fn(),
}));

import {ALL_TOOLS} from "../tools";

describe("ALL_TOOLS", () => {
	it("aggregates exactly the five WebMCP tools in stable order", () => {
		expect(ALL_TOOLS).toHaveLength(5);
		expect(ALL_TOOLS.map((t) => t.name)).toEqual([
			"list_sessions",
			"list_parameter_definitions",
			"set_parameter_values",
			"create_model_state",
			"import_model_state",
		]);
	});
});
