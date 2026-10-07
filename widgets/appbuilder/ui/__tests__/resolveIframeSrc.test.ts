import {resolveIframeSrc} from "../resolveIframeSrc";

describe("resolveIframeSrc", () => {
	it("accepts absolute http(s) URLs", () => {
		expect(resolveIframeSrc("https://example.com/docs")).toBe(
			"https://example.com/docs",
		);
		expect(resolveIframeSrc("  http://localhost:3001/app  ")).toBe(
			"http://localhost:3001/app",
		);
	});

	it("rejects empty, relative, and non-http URLs", () => {
		expect(resolveIframeSrc(undefined)).toBeUndefined();
		expect(resolveIframeSrc("  ")).toBeUndefined();
		expect(resolveIframeSrc("/agent")).toBeUndefined();
		expect(resolveIframeSrc("javascript:alert(1)")).toBeUndefined();
		expect(resolveIframeSrc("data:text/html,hi")).toBeUndefined();
	});
});
