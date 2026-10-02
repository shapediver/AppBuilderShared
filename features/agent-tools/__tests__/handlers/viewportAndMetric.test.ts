import type {AgentToolsDeps} from "../../model/agentToolsDeps";
import {handleGetCamera} from "../../model/handlers/getCamera";
import {handleGetMetric} from "../../model/handlers/getMetric";
import {handleGetScreenshot} from "../../model/handlers/getScreenshot";
import {handleSetCamera} from "../../model/handlers/setCamera";

const camera = {
	id: "default",
	type: "perspective" as const,
	position: [8, 6, 8] as [number, number, number],
	target: [0, 0, 0] as [number, number, number],
	fov: 50,
};

function createDeps(overrides: Partial<AgentToolsDeps> = {}): AgentToolsDeps {
	return {
		controllerNamespace: "c",
		getLiveParameters: () => [],
		listSessionNamespaces: () => ["c"],
		getAppBuilder: () => ({version: "1.0", containers: []}),
		batchParameterValueUpdate: jest.fn().mockResolvedValue(undefined),
		getDefaultToolbarActions: () => [],
		createModelState: async () => ({success: true}),
		importModelState: async () => ({success: true}),
		undo: async () => ({success: true}),
		redo: async () => ({success: true}),
		resetParameters: async () => ({success: true}),
		getViewportId: () => "vp",
		setCamera: jest.fn().mockResolvedValue({success: true}),
		getCamera: jest.fn(() => undefined),
		getScreenshot: jest.fn().mockResolvedValue(undefined),
		getOutputByName: () => undefined,
		...overrides,
	};
}

describe("handleSetCamera", () => {
	it("returns Viewport not found when viewportId is missing", async () => {
		const deps = createDeps({getViewportId: () => ""});

		const result = await handleSetCamera(camera, deps);

		expect(result).toEqual({
			success: false,
			message: "Viewport not found.",
		});
		expect(deps.setCamera).not.toHaveBeenCalled();
	});

	it("accepts a document without type", async () => {
		const deps = createDeps();
		const withoutType = {
			position: [1, 2, 3] as [number, number, number],
			target: [0, 0, 0] as [number, number, number],
		};

		const result = await handleSetCamera(withoutType, deps);

		expect(deps.setCamera).toHaveBeenCalledWith({
			viewportId: "vp",
			camera: withoutType,
		});
		expect(result).toEqual({success: true});
	});

	it("calls setCamera with the camera document", async () => {
		const deps = createDeps();

		const result = await handleSetCamera(camera, deps);

		expect(deps.setCamera).toHaveBeenCalledWith({
			viewportId: "vp",
			camera,
		});
		expect(result).toEqual({success: true});
	});

	it("rejects extra keys", async () => {
		const deps = createDeps();

		const result = await handleSetCamera(
			{...camera, viewportId: "other"},
			deps,
		);

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(deps.setCamera).not.toHaveBeenCalled();
	});

	it("accepts a partial document", async () => {
		const deps = createDeps();
		const partial = {fov: 40};

		const result = await handleSetCamera(partial, deps);

		expect(deps.setCamera).toHaveBeenCalledWith({
			viewportId: "vp",
			camera: partial,
		});
		expect(result).toEqual({success: true});
	});

	it("accepts an orthographic camera without fov", async () => {
		const deps = createDeps();
		const orthographic = {
			type: "orthographic" as const,
			position: [0, 10, 0] as [number, number, number],
			target: [0, 0, 0] as [number, number, number],
			direction: "top" as const,
		};

		const result = await handleSetCamera(orthographic, deps);

		expect(deps.setCamera).toHaveBeenCalledWith({
			viewportId: "vp",
			camera: orthographic,
		});
		expect(result).toEqual({success: true});
	});

	it("rejects a position that is not a vec3", async () => {
		const deps = createDeps();

		const result = await handleSetCamera({position: [1, 1]}, deps);

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(deps.setCamera).not.toHaveBeenCalled();
	});
});

describe("handleGetCamera", () => {
	it("returns Viewport not found when viewportId is missing", async () => {
		const deps = createDeps({getViewportId: () => ""});

		const result = await handleGetCamera({}, deps);

		expect(result).toEqual({
			success: false,
			message: "Viewport not found.",
		});
		expect(deps.getCamera).not.toHaveBeenCalled();
	});

	it("returns Camera not found when the viewport has no camera", async () => {
		const result = await handleGetCamera({}, createDeps());

		expect(result).toEqual({
			success: false,
			message: "Camera not found.",
		});
	});

	it("returns the active camera document", async () => {
		const getCamera = jest.fn(() => camera);
		const deps = createDeps({getCamera});

		const result = await handleGetCamera({}, deps);

		expect(getCamera).toHaveBeenCalledWith("vp");
		expect(result).toEqual({success: true, camera});
	});

	it("rejects extra keys", async () => {
		const deps = createDeps();

		const result = await handleGetCamera({viewportId: "other"}, deps);

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(deps.getCamera).not.toHaveBeenCalled();
	});
});

describe("handleGetScreenshot", () => {
	it("returns Viewport not found when viewportId is missing", async () => {
		const deps = createDeps({getViewportId: () => ""});

		const result = await handleGetScreenshot({}, deps);

		expect(result).toEqual({
			success: false,
			message: "Viewport not found.",
		});
		expect(deps.getScreenshot).not.toHaveBeenCalled();
	});

	it("returns Screenshot failed when the image is empty or undefined", async () => {
		const empty = await handleGetScreenshot(
			{},
			createDeps({getScreenshot: async () => ""}),
		);
		const missing = await handleGetScreenshot({}, createDeps());

		expect(empty).toEqual({
			success: false,
			message: "Screenshot failed.",
		});
		expect(missing).toEqual({
			success: false,
			message: "Screenshot failed.",
		});
	});

	it("returns success with the image data URL from deps viewport", async () => {
		const image = "data:image/png;base64,abc";
		const getScreenshot = jest.fn().mockResolvedValue(image);
		const deps = createDeps({
			getViewportId: () => "from-deps",
			getScreenshot,
		});

		const result = await handleGetScreenshot({}, deps);

		expect(getScreenshot).toHaveBeenCalledWith("from-deps", {});
		expect(result).toEqual({success: true, image_url: image});
	});

	it("rejects extra viewportId on input", async () => {
		const getScreenshot = jest
			.fn()
			.mockResolvedValue("data:image/png;base64,abc");
		const deps = createDeps({
			getViewportId: () => "from-deps",
			getScreenshot,
		});

		const result = await handleGetScreenshot(
			{viewportId: "from-input"},
			deps,
		);

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(getScreenshot).not.toHaveBeenCalled();
	});

	it("passes contentType, quality, and resolution to getScreenshot", async () => {
		const image_url = "data:image/jpeg;base64,abc";
		const getScreenshot = jest.fn().mockResolvedValue(image_url);
		const deps = createDeps({getScreenshot});

		const result = await handleGetScreenshot(
			{
				contentType: "image/jpeg",
				quality: 0.5,
				resolution: {width: 800, height: 600},
			},
			deps,
		);

		expect(getScreenshot).toHaveBeenCalledWith("vp", {
			contentType: "image/jpeg",
			quality: 0.5,
			resolution: {width: 800, height: 600},
		});
		expect(result).toEqual({success: true, image_url});
	});

	it("rejects an unknown contentType", async () => {
		const getScreenshot = jest.fn();
		const result = await handleGetScreenshot(
			{contentType: "image/webp"},
			createDeps({getScreenshot}),
		);

		expect(result.success).toBe(false);
		expect(getScreenshot).not.toHaveBeenCalled();
	});
});

describe("handleGetMetric", () => {
	it("returns found false without a message when AgentMetric is missing", async () => {
		const result = await handleGetMetric({}, createDeps());

		expect(result).toEqual({found: false});
	});

	it("returns found false with a message when extra keys are present", async () => {
		const result = await handleGetMetric({extra: true}, createDeps());

		expect(result.found).toBe(false);
		expect(typeof result.message).toBe("string");
	});

	it("returns found true with the AgentMetric content", async () => {
		const content = {price: 12};
		const result = await handleGetMetric(
			{},
			createDeps({
				getOutputByName: (namespace, name) =>
					namespace === "c" && name === "AgentMetric"
						? {content}
						: undefined,
			}),
		);

		expect(result).toEqual({found: true, value: content});
	});
});
