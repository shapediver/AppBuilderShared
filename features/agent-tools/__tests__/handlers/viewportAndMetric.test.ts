import type {AgentToolsDeps} from "../../model/agentToolsDeps";
import {handleGetMetric} from "../../model/handlers/getMetric";
import {handleGetScreenshot} from "../../model/handlers/getScreenshot";
import {handleSetCameraPosition} from "../../model/handlers/setCameraPosition";

const position = {x: 1, y: 2, z: 3};
const target = {x: 0, y: 1, z: 0};

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
		getScreenshot: jest.fn().mockResolvedValue(undefined),
		getOutputByName: () => undefined,
		...overrides,
	};
}

describe("handleSetCameraPosition", () => {
	it("returns Viewport not found when viewportId is missing", async () => {
		const deps = createDeps({getViewportId: () => ""});

		const result = await handleSetCameraPosition({position, target}, deps);

		expect(result).toEqual({
			success: false,
			message: "Viewport not found.",
		});
		expect(deps.setCamera).not.toHaveBeenCalled();
	});

	it("calls setCamera with parsed vec3 and fallback viewportId", async () => {
		const deps = createDeps();

		const result = await handleSetCameraPosition({position, target}, deps);

		expect(deps.setCamera).toHaveBeenCalledWith({
			viewportId: "vp",
			position,
			target,
		});
		expect(result).toEqual({success: true});
	});

	it("rejects extra viewportId on input", async () => {
		const deps = createDeps({getViewportId: () => "from-deps"});

		const result = await handleSetCameraPosition(
			{position, target, viewportId: "from-input"},
			deps,
		);

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(deps.setCamera).not.toHaveBeenCalled();
	});

	it("rejects input without position or target", async () => {
		const deps = createDeps();

		const result = await handleSetCameraPosition({}, deps);

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
		expect(deps.setCamera).not.toHaveBeenCalled();
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

		expect(getScreenshot).toHaveBeenCalledWith("from-deps");
		expect(result).toEqual({success: true, image});
	});

	it("rejects extra viewportId on input", async () => {
		const getScreenshot = jest
			.fn()
			.mockResolvedValue("data:image/png;base64,abc");
		const deps = createDeps({
			getViewportId: () => "from-deps",
			getScreenshot,
		});

		const result = await handleGetScreenshot({viewportId: "from-input"}, deps);

		expect(result.success).toBe(false);
		expect(typeof result.message).toBe("string");
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
