import type {AgentToolsDeps} from "../../model/agentToolsDeps";
import {handleSetParameterValues} from "../../model/handlers/setParameterValues";

function createDeps(): AgentToolsDeps {
	return {
		controllerNamespace: "c",
		getLiveParameters: () => [],
		listSessionNamespaces: () => ["c"],
		getAppBuilder: () => ({version: "1.0", containers: []}),
		batchParameterValueUpdate: jest.fn().mockResolvedValue(undefined),
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

	it("delegates parsed updates to resolveAndUpdate", async () => {
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
