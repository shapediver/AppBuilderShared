import {defaultAgentUrlForEnvironment} from "../defaultAgentUrl";

describe("defaultAgentUrlForEnvironment", () => {
	it("maps known environments to origin-only defaults", () => {
		expect(defaultAgentUrlForEnvironment("localhost")).toBe(
			"http://localhost:3001",
		);
		expect(defaultAgentUrlForEnvironment("sandbox")).toBe(
			"https://dev-agent.shapediver.com",
		);
		expect(defaultAgentUrlForEnvironment("development")).toBe(
			"https://dev-agent.shapediver.com",
		);
		expect(defaultAgentUrlForEnvironment("staging")).toBe(
			"https://staging-agent.shapediver.com",
		);
		expect(defaultAgentUrlForEnvironment("production")).toBe(
			"https://agent.shapediver.com",
		);
		expect(defaultAgentUrlForEnvironment("iframe")).toBe(
			"https://agent.shapediver.com",
		);
	});

	it("has no default for unknown", () => {
		expect(defaultAgentUrlForEnvironment("unknown")).toBeUndefined();
		expect(defaultAgentUrlForEnvironment("custom")).toBeUndefined();
	});
});
