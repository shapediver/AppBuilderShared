import {
	getModelContext,
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

const mockModelContext = {
	registerTool: async () => undefined,
	getTools: () => [],
	executeTool: async () => undefined,
};

describe("modelContext host", () => {
	const originalCoi = Object.getOwnPropertyDescriptor(
		globalThis,
		"crossOriginIsolated",
	);

	afterEach(() => {
		Reflect.deleteProperty(globalThis, "document");
		Reflect.deleteProperty(globalThis, "navigator");
		if (originalCoi) {
			Object.defineProperty(globalThis, "crossOriginIsolated", originalCoi);
		} else {
			Reflect.deleteProperty(globalThis, "crossOriginIsolated");
		}
	});

	it("is unavailable without document or navigator modelContext", () => {
		expect(isWebMcpAvailable()).toBe(false);
		try {
			getModelContext();
			throw new Error("expected getModelContext to throw");
		} catch (e) {
			expect(e).toBeInstanceOf(Error);
			expect(e).not.toBeInstanceOf(TypeError);
		}
	});

	it("does not throw when navigator is undefined", () => {
		Object.defineProperty(globalThis, "navigator", {
			value: undefined,
			configurable: true,
		});
		expect(isWebMcpAvailable()).toBe(false);
	});

	it("reads modelContext from document", () => {
		Object.defineProperty(globalThis, "document", {
			value: {modelContext: mockModelContext},
			configurable: true,
		});
		expect(isWebMcpAvailable()).toBe(true);
		expect(getModelContext()).toBe(mockModelContext);
	});

	it("reads modelContext from navigator when document has none", () => {
		Object.defineProperty(globalThis, "navigator", {
			value: {modelContext: mockModelContext},
			configurable: true,
		});
		expect(isWebMcpAvailable()).toBe(true);
		expect(getModelContext()).toBe(mockModelContext);
	});

	it("ready is true when host and cross-origin isolation are present", () => {
		Object.defineProperty(globalThis, "document", {
			value: {modelContext: mockModelContext},
			configurable: true,
		});
		Object.defineProperty(globalThis, "crossOriginIsolated", {
			value: true,
			configurable: true,
		});
		const env = getWebMcpEnvironment();
		expect(env.modelContextAvailable).toBe(true);
		expect(env.crossOriginIsolated).toBe(true);
		expect(env.ready).toBe(true);
	});
});
