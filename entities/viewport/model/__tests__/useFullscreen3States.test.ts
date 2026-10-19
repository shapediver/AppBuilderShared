/**
 * @jest-environment jsdom
 */
import {
	Fullscreen3StatesState,
	cycleFullscreen3States,
	getFullscreen3StatesState,
} from "../useFullscreen3States";
import {useShapeDiverDefaultViewportToolbarStore} from "../useShapeDiverDefaultViewportToolbarStore";

describe("cycleFullscreen3States", () => {
	const originalFullscreenElement = Object.getOwnPropertyDescriptor(
		Document.prototype,
		"fullscreenElement",
	);
	const requestFullscreen = jest.fn(async () => {});
	const exitFullscreen = jest.fn(async () => {});
	let appElement: HTMLDivElement;

	beforeEach(() => {
		requestFullscreen.mockClear();
		exitFullscreen.mockClear();
		useShapeDiverDefaultViewportToolbarStore
			.getState()
			.setViewerFullscreen3States(false);
		appElement = document.createElement("div");
		appElement.className = "viewer-fullscreen-area";
		(
			appElement as HTMLDivElement & {
				requestFullscreen: () => Promise<void>;
			}
		).requestFullscreen = requestFullscreen;
		document.body.appendChild(appElement);
		document.exitFullscreen = exitFullscreen;
		Object.defineProperty(document, "fullscreenElement", {
			configurable: true,
			get: () => null,
		});
	});

	afterEach(() => {
		appElement.remove();
		useShapeDiverDefaultViewportToolbarStore
			.getState()
			.setViewerFullscreen3States(false);
		if (originalFullscreenElement) {
			Object.defineProperty(
				document,
				"fullscreenElement",
				originalFullscreenElement,
			);
		}
	});

	it("enters app fullscreen from the default state", () => {
		expect(getFullscreen3StatesState()).toBe(
			Fullscreen3StatesState.DEFAULT,
		);
		cycleFullscreen3States("viewer-fullscreen-area");
		expect(requestFullscreen).toHaveBeenCalledTimes(1);
	});

	it("hides UI when already in app fullscreen", () => {
		Object.defineProperty(document, "fullscreenElement", {
			configurable: true,
			get: () => appElement,
		});
		cycleFullscreen3States("viewer-fullscreen-area");
		expect(
			useShapeDiverDefaultViewportToolbarStore.getState()
				.viewerFullscreen3States,
		).toBe(true);
		expect(getFullscreen3StatesState()).toBe(Fullscreen3StatesState.VIEWER);
	});

	it("exits fullscreen from the viewer state", () => {
		Object.defineProperty(document, "fullscreenElement", {
			configurable: true,
			get: () => appElement,
		});
		useShapeDiverDefaultViewportToolbarStore
			.getState()
			.setViewerFullscreen3States(true);
		cycleFullscreen3States("viewer-fullscreen-area");
		expect(
			useShapeDiverDefaultViewportToolbarStore.getState()
				.viewerFullscreen3States,
		).toBe(false);
		expect(exitFullscreen).toHaveBeenCalledTimes(1);
	});
});
