/**
 * @jest-environment jsdom
 */
import {renderHook} from "@testing-library/react";
import {
	useInteractionEngine,
	useInteractionEnginePause,
} from "../useInteractionEngine";

/** The interaction engines created by the hook (Viewer mocked). */
const mockEngines: {
	props: unknown;
	paused: boolean;
	closed: boolean;
}[] = [];

jest.mock("@shapediver/viewer.features.interaction", () => ({
	InteractionEngine: jest.fn().mockImplementation((_viewport, props) => {
		const engine = {
			props,
			paused: false,
			closed: false,
			pause: () => (engine.paused = true),
			continue: () => (engine.paused = false),
			close: () => (engine.closed = true),
		};
		mockEngines.push(engine);
		return engine;
	}),
}));

const mockViewportId = "viewport-pause";
// a stable store state, the hook creates the engine once per viewport object
const mockViewportState = {
	viewports: {[mockViewportId]: {id: mockViewportId}},
};
jest.mock(
	"@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport",
	() => ({
		useShapeDiverStoreViewport: (
			selector: (state: typeof mockViewportState) => unknown,
		) => selector(mockViewportState),
	}),
);

/**
 * Tests for the pause of the shared interaction engine of a viewport while a
 * computation runs (busy mode of App Builder).
 */
describe("useInteractionEnginePause", () => {
	beforeEach(() => {
		mockEngines.length = 0;
	});

	const renderEngine = () =>
		renderHook(() => useInteractionEngine(mockViewportId, "component"));
	const renderPause = (paused: boolean) =>
		renderHook(
			({paused}) => useInteractionEnginePause(mockViewportId, paused),
			{initialProps: {paused}},
		);

	it("creates the engine with the pause while the viewport is busy", () => {
		const engine = renderEngine();
		expect(mockEngines[0].props).toEqual({pauseWhileBusy: true});
		engine.unmount();
	});

	it("pauses the engine while any component requests it", () => {
		const engine = renderEngine();
		const first = renderPause(true);
		const second = renderPause(true);
		expect(mockEngines[0].paused).toBe(true);

		// one request is left
		first.rerender({paused: false});
		expect(mockEngines[0].paused).toBe(true);

		second.unmount();
		expect(mockEngines[0].paused).toBe(false);
		first.unmount();
		engine.unmount();
	});

	it("pauses an engine created while a pause is requested", () => {
		const pause = renderPause(true);
		const engine = renderEngine();
		expect(mockEngines[0].paused).toBe(true);
		pause.unmount();
		expect(mockEngines[0].paused).toBe(false);
		engine.unmount();
	});
});
