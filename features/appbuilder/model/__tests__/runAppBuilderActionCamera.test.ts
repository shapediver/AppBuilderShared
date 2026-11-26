import {AppBuilderActionType} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionType";
import {runAppBuilderActionCamera} from "../runAppBuilderActionCamera";

const mockViewports: Record<string, unknown> = {};

jest.mock(
	"@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport",
	() => ({
		useShapeDiverStoreViewport: {
			getState: () => ({viewports: mockViewports}),
		},
	}),
);

jest.mock(
	"@AppBuilderLib/entities/parameter/lib/findNodesByNameFilter",
	() => ({
		findNodesByNameFilter: jest.fn(() => []),
	}),
);

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));

import {Logger} from "@AppBuilderLib/shared/lib/logger";

jest.mock(
	"@shapediver/viewer.viewport",
	() => ({
		Box: jest.fn(),
		CAMERA_TYPE: {PERSPECTIVE: "perspective", ORTHOGRAPHIC: "orthographic"},
		ORTHOGRAPHIC_CAMERA_DIRECTION: {
			TOP: "top",
			BOTTOM: "bottom",
			LEFT: "left",
			RIGHT: "right",
			FRONT: "front",
			BACK: "back",
			CUSTOM: "custom",
		},
	}),
	{virtual: true},
);

const createCamera = (
	id: string,
	initialAutoAdjust: boolean,
	type: "perspective" | "orthographic" = "perspective",
) => ({
	id,
	name: id,
	type,
	initialAutoAdjust,
	position: [0, 0, 0],
	target: [0, 0, 0],
	zoomTo: jest.fn().mockResolvedValue(undefined),
	set: jest.fn().mockResolvedValue(undefined),
});

const setup = () => {
	const cameraA = createCamera("a", false, "perspective");
	const cameraB = createCamera("b", true, "perspective");
	const viewport = {
		camera: cameraA,
		cameras: {a: cameraA, b: cameraB} as Record<
			string,
			ReturnType<typeof createCamera>
		>,
		assignCamera: jest.fn((id: string) => {
			viewport.camera = viewport.cameras[id];
			return true;
		}),
		createPerspectiveCamera: jest.fn(() => {
			const camera = createCamera(
				"created-perspective",
				false,
				"perspective",
			);
			viewport.cameras[camera.id] = camera;
			return camera;
		}),
		createOrthographicCamera: jest.fn(() => {
			const camera = createCamera(
				"created-orthographic",
				false,
				"orthographic",
			);
			viewport.cameras[camera.id] = camera;
			return camera;
		}),
	};
	mockViewports["viewport"] = viewport;

	return {cameraA, cameraB, viewport};
};

const assign = (
	props: Record<string, unknown>,
	extra: Record<string, unknown> = {},
) =>
	runAppBuilderActionCamera(
		{
			type: AppBuilderActionType.Camera,
			props: {
				type: "assign",
				props: {camera: {name: "b"}, ...extra},
				viewportId: "viewport",
				...props,
			},
		} as never,
		{strict: true} as never,
	);

const setCamera = (extra: Record<string, unknown> = {}) =>
	runAppBuilderActionCamera(
		{
			type: AppBuilderActionType.Camera,
			props: {
				type: "set",
				props: {
					position: [4, 5, 6],
					target: [0, 0, 0],
					...extra,
				},
				viewportId: "viewport",
			},
		} as never,
		{strict: true} as never,
	);

describe("runAppBuilderActionCamera assign", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("fits the camera to the scene when it has initialAutoAdjust", async () => {
		const {cameraB, viewport} = setup();

		await assign({});

		expect(viewport.assignCamera).toHaveBeenCalledWith("b");
		expect(cameraB.zoomTo).toHaveBeenCalledTimes(1);
		expect(cameraB.zoomTo).toHaveBeenCalledWith(undefined, {duration: 0});
	});

	it("uses the options of the action for the fit", async () => {
		const {cameraB} = setup();

		await assign({}, {options: {duration: 500}});

		expect(cameraB.zoomTo).toHaveBeenCalledWith(undefined, {duration: 500});
	});

	it("does not fit a camera without initialAutoAdjust", async () => {
		const {cameraA, viewport} = setup();

		await assign({}, {camera: {name: "a"}});

		expect(viewport.assignCamera).toHaveBeenCalledWith("a");
		expect(cameraA.zoomTo).not.toHaveBeenCalled();
	});

	it("does not fit when the action defines position or target", async () => {
		const {cameraB} = setup();

		await assign(
			{},
			{camera: {name: "b", position: [1, 2, 3], target: [0, 0, 0]}},
		);

		expect(cameraB.zoomTo).not.toHaveBeenCalled();
	});

	it("skips direction on a perspective camera, warns, and still applies position", async () => {
		const {cameraB} = setup();

		await assign(
			{},
			{
				camera: {
					name: "b",
					direction: "top",
					position: [1, 2, 3],
					target: [0, 0, 0],
				},
			},
		);

		expect((cameraB as {direction?: string}).direction).toBeUndefined();
		expect(Logger.warn).toHaveBeenCalledWith(
			'Skipping "direction" for camera "b" (type perspective).',
		);
		expect(Array.from(cameraB.position as ArrayLike<number>)).toEqual([
			1, 2, 3,
		]);
	});

	it("writes direction on an orthographic camera", async () => {
		const {cameraB} = setup();
		cameraB.type = "orthographic";

		await assign(
			{},
			{
				camera: {
					name: "b",
					direction: "top",
					position: [1, 2, 3],
					target: [0, 0, 0],
				},
			},
		);

		expect((cameraB as {direction?: string}).direction).toBe("top");
		expect(Logger.warn).not.toHaveBeenCalled();
	});

	it("skips fov on an orthographic camera with a warning", async () => {
		const {cameraB} = setup();
		cameraB.type = "orthographic";

		await assign(
			{},
			{
				camera: {
					name: "b",
					fov: 40,
					position: [1, 2, 3],
					target: [0, 0, 0],
				},
			},
		);

		expect((cameraB as {fov?: number}).fov).toBeUndefined();
		expect(Logger.warn).toHaveBeenCalledWith(
			'Skipping "fov" for camera "b" (type orthographic).',
		);
		expect(Array.from(cameraB.position as ArrayLike<number>)).toEqual([
			1, 2, 3,
		]);
	});

	it("skips direction when creating a perspective camera", async () => {
		const {viewport} = setup();

		await assign(
			{},
			{
				camera: {
					type: "perspective",
					direction: "top",
					position: [1, 2, 3],
					target: [0, 0, 0],
				},
			},
		);

		const created = viewport.createPerspectiveCamera.mock.results[0]
			.value as ReturnType<typeof createCamera>;
		expect((created as {direction?: string}).direction).toBeUndefined();
		expect(Logger.warn).toHaveBeenCalledWith(
			'Skipping "direction" for camera "created-perspective" (type perspective).',
		);
		expect(Array.from(created.position as ArrayLike<number>)).toEqual([
			1, 2, 3,
		]);
	});
});

describe("runAppBuilderActionCamera set", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("warns when direction is set on a perspective camera", async () => {
		const {cameraA} = setup();

		await setCamera({
			camera: {name: "a", direction: "top"},
		});

		expect((cameraA as {direction?: string}).direction).toBeUndefined();
		expect(Logger.warn).toHaveBeenCalledWith(
			'Skipping "direction" for camera "a" (type perspective).',
		);
	});
});
