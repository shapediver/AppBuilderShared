import type {IAppBuilder} from "../appbuilder";
import type {IAppBuilderAgent} from "../appbuilderagent";
import {applyAgentOverride} from "../applyAgentOverride";

const modelData: IAppBuilder = {
	version: "1.0",
	sessionId: "controller",
	containers: [],
	agents: [
		{
			id: "from-model",
			name: "Model Agent",
			message: "From the model.",
		},
	],
};

const overrideAgents: IAppBuilderAgent[] = [
	{
		id: "from-settings",
		name: "Settings Agent",
		message: "From settings.",
	},
];

describe("applyAgentOverride", () => {
	it("is a no-op when agentOverride is omitted", () => {
		expect(applyAgentOverride(modelData, undefined)).toBe(modelData);
		expect(applyAgentOverride(undefined, undefined)).toBeUndefined();
	});

	it("replaces agents on parsed App Builder data", () => {
		expect(applyAgentOverride(modelData, overrideAgents)).toEqual({
			...modelData,
			agents: overrideAgents,
		});
	});

	it("replaces agents on a full appBuilderOverride", () => {
		const fullOverride: IAppBuilder = {
			version: "1.0",
			containers: [],
			agents: [
				{
					id: "from-full-override",
					name: "Full Override Agent",
					message: "From appBuilderOverride.",
				},
			],
		};

		expect(applyAgentOverride(fullOverride, overrideAgents)).toEqual({
			...fullOverride,
			agents: overrideAgents,
		});
	});

	it("synthesizes a skeleton when there is no App Builder data", () => {
		expect(applyAgentOverride(undefined, overrideAgents)).toEqual({
			version: "1.0",
			containers: [],
			agents: overrideAgents,
		});
	});

	it("leaves parse errors unchanged", () => {
		const error = new Error("App Builder layout invalid");
		expect(applyAgentOverride(error, overrideAgents)).toBe(error);
	});

	it("replaces agents with an empty array when that is the override", () => {
		expect(applyAgentOverride(modelData, [])).toEqual({
			...modelData,
			agents: [],
		});
	});
});
