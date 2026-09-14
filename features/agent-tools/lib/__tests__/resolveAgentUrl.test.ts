import {resolveAgentUrl} from "../resolveAgentUrl";

describe("resolveAgentUrl", () => {
	it("returns undefined when query and default are missing", () => {
		expect(resolveAgentUrl(null, "unknown")).toBeUndefined();
		expect(resolveAgentUrl("  ", "unknown")).toBeUndefined();
	});

	it("uses the environment default when query is missing", () => {
		expect(resolveAgentUrl(null, "localhost")).toBe(
			"http://localhost:3001",
		);
		expect(resolveAgentUrl("  ", "development")).toBe(
			"https://dev-agent.shapediver.com",
		);
	});

	it("query wins on localhost, sandbox, development, staging, and unknown", () => {
		const query = "http://localhost:3001/custom";
		expect(resolveAgentUrl(query, "localhost")).toBe(query);
		expect(resolveAgentUrl(query, "sandbox")).toBe(query);
		expect(resolveAgentUrl(query, "development")).toBe(query);
		expect(resolveAgentUrl(query, "staging")).toBe(query);
		expect(resolveAgentUrl(query, "unknown")).toBe(query);
	});

	it("ignores query on production and iframe", () => {
		const query = "http://evil.example/agent";
		expect(resolveAgentUrl(query, "production")).toBe(
			"https://agent.shapediver.com",
		);
		expect(resolveAgentUrl(query, "iframe")).toBe(
			"https://agent.shapediver.com",
		);
	});

	it("trims whitespace on query", () => {
		expect(
			resolveAgentUrl("  http://localhost:3001/app  ", "localhost"),
		).toBe("http://localhost:3001/app");
	});
});
