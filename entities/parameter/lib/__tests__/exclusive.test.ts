import {resolveExclusive} from "../exclusive";

describe("resolveExclusive", () => {
	it("is disabled by default", () => {
		expect(resolveExclusive(undefined)).toBe(false);
		expect(resolveExclusive({activeMode: "alwaysActive"})).toBe(false);
		expect(
			resolveExclusive({activeMode: "alwaysActive", exclusive: false}),
		).toBe(false);
	});

	it("requires alwaysActive", () => {
		expect(resolveExclusive({exclusive: true})).toBe(false);
		expect(
			resolveExclusive({activeMode: "activeOnStart", exclusive: true}),
		).toBe(false);
		expect(
			resolveExclusive({activeMode: "alwaysActive", exclusive: true}),
		).toBe(true);
	});
});
