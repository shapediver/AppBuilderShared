import {resolveAgentUrl} from "../resolveAgentUrl";

describe("resolveAgentUrl", () => {
	it("returns undefined when both are missing or blank", () => {
		expect(resolveAgentUrl(null, undefined)).toBeUndefined();
		expect(resolveAgentUrl("  ", "   ")).toBeUndefined();
	});

	it("uses settings when query is missing", () => {
		expect(
			resolveAgentUrl(null, "http://localhost:3001/app"),
		).toBe("http://localhost:3001/app");
	});

	it("query wins over settings", () => {
		expect(
			resolveAgentUrl(
				"http://localhost:3001/app",
				"http://example.invalid/agent",
			),
		).toBe("http://localhost:3001/app");
	});

	it("trims whitespace", () => {
		expect(resolveAgentUrl("  http://localhost:3001/app  ", undefined)).toBe(
			"http://localhost:3001/app",
		);
	});
});
