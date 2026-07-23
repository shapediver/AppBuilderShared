import {
	getWebMcpEnvironment,
	isCrossOriginIsolated,
	isWebMcpAvailable,
} from "../lib/webmcpAvailability";

describe("isCrossOriginIsolated", () => {
	const original = Object.getOwnPropertyDescriptor(
		globalThis,
		"crossOriginIsolated",
	);

	afterEach(() => {
		if (original) {
			Object.defineProperty(globalThis, "crossOriginIsolated", original);
		} else {
			Reflect.deleteProperty(globalThis, "crossOriginIsolated");
		}
	});

	it("returns false when crossOriginIsolated is undefined", () => {
		Reflect.deleteProperty(globalThis, "crossOriginIsolated");
		expect(isCrossOriginIsolated()).toBe(false);
	});

	it("returns true when crossOriginIsolated is true", () => {
		Object.defineProperty(globalThis, "crossOriginIsolated", {
			value: true,
			configurable: true,
		});
		expect(isCrossOriginIsolated()).toBe(true);
	});

	it("returns false when crossOriginIsolated is false", () => {
		Object.defineProperty(globalThis, "crossOriginIsolated", {
			value: false,
			configurable: true,
		});
		expect(isCrossOriginIsolated()).toBe(false);
	});
});

describe("getWebMcpEnvironment", () => {
	const original = Object.getOwnPropertyDescriptor(
		globalThis,
		"crossOriginIsolated",
	);

	afterEach(() => {
		if (original) {
			Object.defineProperty(globalThis, "crossOriginIsolated", original);
		} else {
			Reflect.deleteProperty(globalThis, "crossOriginIsolated");
		}
	});

	it("returns structure with ready = modelContextAvailable && crossOriginIsolated", () => {
		Object.defineProperty(globalThis, "crossOriginIsolated", {
			value: true,
			configurable: true,
		});

		const env = getWebMcpEnvironment();

		expect(env).toEqual({
			modelContextAvailable: isWebMcpAvailable(),
			crossOriginIsolated: true,
			ready: isWebMcpAvailable() && true,
		});
	});

	it("ready is false when cross-origin isolation is missing", () => {
		Reflect.deleteProperty(globalThis, "crossOriginIsolated");

		const env = getWebMcpEnvironment();

		expect(env.crossOriginIsolated).toBe(false);
		expect(env.ready).toBe(false);
	});
});
