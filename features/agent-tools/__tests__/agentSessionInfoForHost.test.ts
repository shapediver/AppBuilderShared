import {agentSessionInfoForHost} from "../lib/agentSessionInfoForHost";

describe("agentSessionInfoForHost", () => {
	it("returns undefined when there is no controller session", () => {
		expect(agentSessionInfoForHost(undefined, "live")).toBeUndefined();
	});

	it("prefers the viewer session token over the settings dto", () => {
		expect(
			agentSessionInfoForHost(
				{jwtToken: "original", slug: "my-model", modelStateId: "ms-1"},
				"refreshed",
			),
		).toEqual({
			jwtToken: "refreshed",
			slug: "my-model",
			modelStateId: "ms-1",
		});
	});

	it("uses the settings token before the viewer session exists", () => {
		expect(
			agentSessionInfoForHost({
				jwtToken: "original",
				slug: "my-model",
			}),
		).toEqual({
			jwtToken: "original",
			slug: "my-model",
			modelStateId: undefined,
		});
	});
});
