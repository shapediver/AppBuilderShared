import type {AgentToolsDeps} from "../../model/agentToolsDeps";
import {handleSetParameterValues} from "../../model/handlers/setParameterValues";

function createDeps(): AgentToolsDeps {
	return {
		controllerNamespace: "c",
		getLiveParameters: () => [],
		listSessionNamespaces: () => ["c"],
		getAppBuilder: () => ({version: "1.0", containers: []}),
		batchParameterValueUpdate: jest.fn().mockResolvedValue(undefined),
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

describe("handleSetParameterValues", () => {
	it("returns input error named * when key parameters is used instead of updates", async () => {
		const result = await handleSetParameterValues(
			{parameters: [{name: "width", value: 10}]},
			createDeps(),
		);

		expect(result.applied).toEqual([]);
		expect(result.errors[0].name).toBe("*");
	});

	it("delegates parsed updates to applyParameterUpdates", async () => {
		const result = await handleSetParameterValues(
			{updates: [{name: "width", value: 10}]},
			createDeps(),
		);

		expect(result.applied).toEqual([]);
		expect(result.errors).toEqual([
			expect.objectContaining({name: "width"}),
		]);
	});
});
