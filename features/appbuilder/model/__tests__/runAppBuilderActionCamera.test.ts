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

jest.mock("@shapediver/viewer.viewport", () => ({
	Box: jest.fn(),
	CAMERA_TYPE: {PERSPECTIVE: "perspective", ORTHOGRAPHIC: "orthographic"},
	ORTHOGRAPHIC_CAMERA_DIRECTION: {CUSTOM: "custom"},
}));

const createCamera = (id: string, initialAutoAdjust: boolean) => ({
	id,
	name: id,
	initialAutoAdjust,
	zoomTo: jest.fn().mockResolvedValue(undefined),
});

const setup = () => {
	const cameraA = createCamera("a", false);
	const cameraB = createCamera("b", true);
	const viewport = {
		camera: cameraA,
		cameras: {a: cameraA, b: cameraB},
		assignCamera: jest.fn((id: string) => {
			viewport.camera = viewport.cameras[id as "a" | "b"];
			return true;
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

describe("runAppBuilderActionCamera assign", () => {
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
});
