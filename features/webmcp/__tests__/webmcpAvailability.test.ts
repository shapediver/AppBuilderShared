import {
	getWebMcpEnvironment,
	isWebMcpAvailable,
} from "../lib/webmcpAvailability";

describe("getWebMcpEnvironment", () => {
	it("ready matches modelContextAvailable", () => {
		const env = getWebMcpEnvironment();

		expect(env).toEqual({
			modelContextAvailable: isWebMcpAvailable(),
			ready: isWebMcpAvailable(),
		});
	});
});
