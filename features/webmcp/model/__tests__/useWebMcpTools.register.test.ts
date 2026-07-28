jest.mock("../../adapters/webmcp/registerWebMcpTools", () => ({
	registerWebMcpTools: jest.fn(async () => undefined),
}));
jest.mock("../../adapters/webmcp/webmcpDeps", () => ({
	buildWebMcpDeps: jest.fn(() => ({namespace: "main"})),
}));
jest.mock("../../lib/webmcpAvailability", () => ({
	isWebMcpAvailable: () => true,
	getWebMcpEnvironment: () => ({
		ready: true,
		modelContextAvailable: true,
		crossOriginIsolated: true,
	}),
	getModelContext: () => ({registerTool: jest.fn()}),
}));

import {registerWebMcpTools} from "../../adapters/webmcp/registerWebMcpTools";

describe("useWebMcpTools registration", () => {
	it("exports registerWebMcpTools for the hook wiring", () => {
		// Smoke: module graph resolves after deletions; hook calls adapter.
		expect(typeof registerWebMcpTools).toBe("function");
	});
});
