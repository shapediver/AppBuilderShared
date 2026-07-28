import {createModelStateTool} from "../createModelState";
import type {ToolDeps} from "../deps";
import {ToolExecutionError} from "../toolDefinition";

function mockDeps(createModelState: ToolDeps["createModelState"]): ToolDeps {
	return {
		namespace: "main",
		getLiveParameters: () => [],
		listParameterNamespaces: () => ["main"],
		batchParameterValueUpdate: jest.fn(),
		createModelState,
		importModelState: jest.fn(),
	};
}

describe("createModelStateTool", () => {
	const signal = new AbortController().signal;

	it("execute returns modelStateId", async () => {
		const deps = mockDeps(async () => ({
			modelStateId: "ms-1",
			modelViewUrl: "https://example.com",
		}));
		await expect(
			createModelStateTool.execute(deps, {includeImage: false}, signal),
		).resolves.toEqual({modelStateId: "ms-1"});
	});

	it("execute throws when modelStateId missing", async () => {
		const deps = mockDeps(async () => ({}));
		await expect(
			createModelStateTool.execute(deps, {}, signal),
		).rejects.toBeInstanceOf(ToolExecutionError);
		await expect(
			createModelStateTool.execute(deps, {}, signal),
		).rejects.toThrow(/Failed to create model state/);
	});

	it("format points at import_model_state", () => {
		expect(createModelStateTool.format({modelStateId: "ms-1"})).toBe(
			"Created model state ms-1. Use import_model_state with this modelStateId to restore it.",
		);
	});
});
