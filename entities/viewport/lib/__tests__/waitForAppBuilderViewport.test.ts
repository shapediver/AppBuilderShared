/**
 * @jest-environment jsdom
 */

const listeners = new Map<string, Set<(event: unknown) => void>>();
const sceneBoundingBox = {empty: true};
const sessionMap: Record<string, {node?: object}> = {};
const viewportMap: Record<string, object> = {};
const storeSubscribers = new Set<() => void>();
const accessMap: Record<
	string,
	{waitUntilReady?: (signal?: AbortSignal) => Promise<void>}
> = {};
const accessSubscribers = new Set<() => void>();

jest.mock("@shapediver/viewer.session", () => ({
	addListener: (type: string, fn: (event: unknown) => void) => {
		if (!listeners.has(type)) listeners.set(type, new Set());
		listeners.get(type)!.add(fn);
		return `${type}:${listeners.get(type)!.size}`;
	},
	removeListener: (token: string) => {
		const type = token.split(":")[0];
		const set = listeners.get(type);
		if (!set) return;
		set.clear();
	},
	sceneTree: {
		root: {
			boundingBox: {
				isEmpty: () => sceneBoundingBox.empty,
			},
		},
	},
	sessions: sessionMap,
	EVENTTYPE_SCENE: {
		SCENE_BOUNDING_BOX_CHANGE: "scene.boundingBoxChange",
		SCENE_BOUNDING_BOX_EMPTY: "scene.boundingBoxEmpty",
	},
	EVENTTYPE_VIEWPORT: {
		VIEWPORT_CREATED: "viewport.created",
	},
}));

jest.mock(
	"@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport",
	() => ({
		useShapeDiverStoreViewport: {
			getState: () => ({viewports: viewportMap}),
			subscribe: (fn: () => void) => {
				storeSubscribers.add(fn);
				return () => storeSubscribers.delete(fn);
			},
		},
	}),
);

jest.mock(
	"@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions",
	() => ({
		useShapeDiverStoreViewportAccessFunctions: {
			getState: () => ({viewportAccessFunctions: accessMap}),
			subscribe: (fn: () => void) => {
				accessSubscribers.add(fn);
				return () => accessSubscribers.delete(fn);
			},
		},
	}),
);

import {
	waitForAppBuilderViewport,
	waitForViewportScene,
} from "../waitForAppBuilderViewport";

function emit(type: string, event: unknown) {
	listeners.get(type)?.forEach((fn) => fn(event));
}

function addViewport() {
	viewportMap.viewport_1 = {id: "viewport_1"};
	storeSubscribers.forEach((fn) => fn());
}

describe("waitForViewportScene", () => {
	beforeEach(() => {
		listeners.clear();
		storeSubscribers.clear();
		sceneBoundingBox.empty = true;
		Object.keys(sessionMap).forEach((key) => delete sessionMap[key]);
		Object.keys(viewportMap).forEach((key) => delete viewportMap[key]);
	});

	it("resolves immediately when the viewport exists and the scene has geometry", async () => {
		addViewport();
		sceneBoundingBox.empty = false;
		await expect(
			waitForViewportScene("viewport_1"),
		).resolves.toBeUndefined();
	});

	it("resolves on scene.boundingBoxChange with a non-empty box", async () => {
		let resolved = false;
		const pending = waitForViewportScene("viewport_1").then(() => {
			resolved = true;
		});
		await Promise.resolve();
		expect(resolved).toBe(false);

		addViewport();
		expect(resolved).toBe(false);

		emit("scene.boundingBoxChange", {
			viewportId: "viewport_1",
			boundingBox: {min: [0, 0, 0], max: [1, 1, 1]},
		});
		await pending;
		expect(resolved).toBe(true);
	});

	it("does not resolve on an empty boundingBoxChange", async () => {
		let resolved = false;
		void waitForViewportScene("viewport_1").then(() => {
			resolved = true;
		});
		addViewport();
		emit("scene.boundingBoxChange", {
			viewportId: "viewport_1",
			boundingBox: {min: [1, 1, 1], max: [0, 0, 0]},
		});
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(resolved).toBe(false);
	});

	it("resolves on scene.boundingBoxEmpty when there is no geometry", async () => {
		let resolved = false;
		const pending = waitForViewportScene("viewport_1").then(() => {
			resolved = true;
		});
		addViewport();
		expect(resolved).toBe(false);

		emit("scene.boundingBoxEmpty", {viewportId: "viewport_1"});
		await pending;
		expect(resolved).toBe(true);
	});

	it("ignores scene events for another viewport", async () => {
		let resolved = false;
		void waitForViewportScene("viewport_1").then(() => {
			resolved = true;
		});
		addViewport();
		emit("scene.boundingBoxEmpty", {viewportId: "other"});
		emit("scene.boundingBoxChange", {
			viewportId: "other",
			boundingBox: {min: [0, 0, 0], max: [1, 1, 1]},
		});
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(resolved).toBe(false);
	});

	it("resolves a late empty scene when session nodes already exist", async () => {
		addViewport();
		sessionMap.controller = {node: {}};
		await expect(
			waitForViewportScene("viewport_1"),
		).resolves.toBeUndefined();
	});

	it("aborts without hanging", async () => {
		const abort = new AbortController();
		const pending = waitForViewportScene("viewport_1", {
			signal: abort.signal,
		});
		abort.abort();
		await expect(pending).resolves.toBeUndefined();
	});
});

describe("waitForAppBuilderViewport", () => {
	beforeEach(() => {
		listeners.clear();
		storeSubscribers.clear();
		accessSubscribers.clear();
		sceneBoundingBox.empty = true;
		Object.keys(sessionMap).forEach((key) => delete sessionMap[key]);
		Object.keys(viewportMap).forEach((key) => delete viewportMap[key]);
		Object.keys(accessMap).forEach((key) => delete accessMap[key]);
	});

	it("resolves immediately when waitForScene is false", async () => {
		await expect(
			waitForAppBuilderViewport("viewport_1", {waitForScene: false}),
		).resolves.toBeUndefined();
	});

	it("uses waitUntilReady from viewport access functions", async () => {
		const waitUntilReady = jest.fn(async () => {});
		accessMap.viewport_1 = {waitUntilReady};

		await waitForAppBuilderViewport("viewport_1");

		expect(waitUntilReady).toHaveBeenCalledTimes(1);
	});

	it("falls back to the scene wait when a ShapeDiver viewport exists", async () => {
		viewportMap.viewport_1 = {id: "viewport_1"};
		sceneBoundingBox.empty = false;

		await expect(
			waitForAppBuilderViewport("viewport_1"),
		).resolves.toBeUndefined();
	});

	it("does not hang when a host viewport has access functions but no waitUntilReady", async () => {
		accessMap.viewport_1 = {};

		await expect(
			waitForAppBuilderViewport("viewport_1"),
		).resolves.toBeUndefined();
	});

	it("waits for access functions to be registered", async () => {
		const waitUntilReady = jest.fn(async () => {});
		let resolved = false;
		const pending = waitForAppBuilderViewport("viewport_1").then(() => {
			resolved = true;
		});
		await Promise.resolve();
		expect(resolved).toBe(false);

		accessMap.viewport_1 = {waitUntilReady};
		accessSubscribers.forEach((fn) => fn());
		await pending;

		expect(resolved).toBe(true);
		expect(waitUntilReady).toHaveBeenCalled();
	});

	it("aborts without hanging", async () => {
		const abort = new AbortController();
		const pending = waitForAppBuilderViewport("viewport_1", {
			signal: abort.signal,
		});
		abort.abort();
		await expect(pending).resolves.toBeUndefined();
	});
});
