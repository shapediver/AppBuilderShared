import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {
	agentUrlFromRequestUrl,
	crossOriginOpenerPolicy,
} from "../crossOriginOpenerPolicy";

describe("crossOriginOpenerPolicy", () => {
	it("is same-origin without query or env", () => {
		expect(crossOriginOpenerPolicy({})).toBe("same-origin");
		expect(
			crossOriginOpenerPolicy({queryAgentUrl: "  ", envAgentUrl: ""}),
		).toBe("same-origin");
	});

	it("is same-origin-allow-popups when query agentUrl is set", () => {
		expect(
			crossOriginOpenerPolicy({
				queryAgentUrl: "http://localhost:3001/app",
			}),
		).toBe("same-origin-allow-popups");
	});

	it("is same-origin-allow-popups when env VITE_AGENT_URL is set", () => {
		expect(
			crossOriginOpenerPolicy({
				envAgentUrl: "http://localhost:3001/app",
			}),
		).toBe("same-origin-allow-popups");
	});

	it("does not take settings.agentUrl", () => {
		expect(
			crossOriginOpenerPolicy({
				queryAgentUrl: null,
				envAgentUrl: undefined,
			}),
		).toBe("same-origin");
	});
});

describe("agentUrlFromRequestUrl", () => {
	it("reads agentUrl from the request query", () => {
		expect(
			agentUrlFromRequestUrl(
				`/?g=all-parameters.json&${QUERYPARAM_AGENTURL}=http://localhost:3001/app`,
			),
		).toBe("http://localhost:3001/app");
	});

	it("returns null without agentUrl query", () => {
		expect(agentUrlFromRequestUrl("/?g=all-parameters.json")).toBeNull();
		expect(agentUrlFromRequestUrl(undefined)).toBeNull();
	});
});
