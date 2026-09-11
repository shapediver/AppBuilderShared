/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */

const viewportControls = {
	showControls: false,
	setIsHoveringControls: jest.fn(),
};

jest.mock("@AppBuilderLib/entities/viewport/model/useViewportControls", () => ({
	useViewportControls: () => viewportControls,
}));

const systemInfo = {instance: {isMobile: false}};

jest.mock("@shapediver/viewer.session", () => ({
	SystemInfo: systemInfo,
}));

import {act, renderHook} from "@testing-library/react";
import {useToolbarVisibility} from "../useToolbarVisibility";

const reducedMotionListeners: Array<() => void> = [];
const mediaQuery = {
	matches: false,
	addEventListener: jest.fn((_event: string, listener: () => void) => {
		reducedMotionListeners.push(listener);
	}),
	removeEventListener: jest.fn(),
};

describe("useToolbarVisibility", () => {
	beforeEach(() => {
		viewportControls.setIsHoveringControls.mockClear();
		reducedMotionListeners.length = 0;
		mediaQuery.matches = false;
		mediaQuery.addEventListener.mockClear();
		mediaQuery.removeEventListener.mockClear();
		window.matchMedia = jest.fn().mockReturnValue(mediaQuery);
	});

	it("always mode is always visible", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "always"}),
		);
		expect(result.current.visible).toBe(true);
	});

	it("defaults delayMs to 500 and accepts an override", () => {
		const {result: defaultResult} = renderHook(() =>
			useToolbarVisibility({mode: "always"}),
		);
		expect(defaultResult.current.delayMs).toBe(500);

		const {result: customResult} = renderHook(() =>
			useToolbarVisibility({mode: "always", delayMs: 0}),
		);
		expect(customResult.current.delayMs).toBe(0);
	});

	it("tracks prefers-reduced-motion from matchMedia", () => {
		mediaQuery.matches = true;
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "always"}),
		);
		expect(window.matchMedia).toHaveBeenCalledWith(
			"(prefers-reduced-motion: reduce)",
		);
		expect(result.current.reducedMotion).toBe(true);

		act(() => {
			mediaQuery.matches = false;
			reducedMotionListeners.forEach((listener) => listener());
		});
		expect(result.current.reducedMotion).toBe(false);
	});

	it("onMouseActivity can be kept visible by focus", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "onMouseActivity"}),
		);
		expect(result.current.visible).toBe(false);
		act(() => {
			result.current.containerProps.onFocus();
		});
		expect(result.current.visible).toBe(true);
	});

	it("pointer focus does not keep onMouseActivity visible after hover ends", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "onMouseActivity"}),
		);
		expect(result.current.visible).toBe(false);
		act(() => {
			result.current.containerProps.onMouseEnter();
			result.current.containerProps.onPointerDown();
			result.current.containerProps.onFocus();
		});
		expect(result.current.visible).toBe(false);
		act(() => {
			result.current.containerProps.onMouseLeave();
		});
		expect(result.current.visible).toBe(false);
	});

	it("keeps keyboard focus after a pointer then Tab sequence", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "onMouseActivity"}),
		);
		act(() => {
			result.current.containerProps.onPointerDown();
			result.current.containerProps.onFocus();
		});
		expect(result.current.visible).toBe(false);
		act(() => {
			result.current.containerProps.onKeyDown();
			result.current.containerProps.onFocus();
		});
		expect(result.current.visible).toBe(true);
	});

	it("clears keyboard focus when pointer down follows", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "onMouseActivity"}),
		);
		act(() => {
			result.current.containerProps.onKeyDown();
			result.current.containerProps.onFocus();
		});
		expect(result.current.visible).toBe(true);
		act(() => {
			result.current.containerProps.onPointerDown();
		});
		expect(result.current.visible).toBe(false);
	});

	it("allows keyboard focus after pointer blur", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "onMouseActivity"}),
		);
		act(() => {
			result.current.containerProps.onPointerDown();
			result.current.containerProps.onFocus();
			result.current.containerProps.onBlur();
			result.current.containerProps.onFocus();
		});
		expect(result.current.visible).toBe(true);
	});

	it("notifies hovering controls on pointer enter, leave, focus, and blur", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "onMouseActivity"}),
		);
		act(() => {
			result.current.containerProps.onMouseEnter();
		});
		expect(viewportControls.setIsHoveringControls).toHaveBeenCalledWith(
			true,
		);
		act(() => {
			result.current.containerProps.onMouseLeave();
		});
		expect(viewportControls.setIsHoveringControls).toHaveBeenCalledWith(
			false,
		);
		act(() => {
			result.current.containerProps.onFocus();
		});
		expect(viewportControls.setIsHoveringControls).toHaveBeenCalledWith(
			true,
		);
		act(() => {
			result.current.containerProps.onBlur();
		});
		expect(viewportControls.setIsHoveringControls).toHaveBeenLastCalledWith(
			false,
		);
	});

	it("stays visible while a toolbar menu is open", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "onMouseActivity"}),
		);
		expect(result.current.visible).toBe(false);
		act(() => {
			result.current.setMenuOpen(true);
		});
		expect(result.current.visible).toBe(true);
	});

	it("is always visible on mobile even in onMouseActivity mode", () => {
		systemInfo.instance.isMobile = true;
		try {
			const {result} = renderHook(() =>
				useToolbarVisibility({mode: "onMouseActivity"}),
			);
			expect(result.current.visible).toBe(true);
		} finally {
			systemInfo.instance.isMobile = false;
		}
	});

	it("clears pointer-driven focus on blur", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "onMouseActivity"}),
		);
		act(() => {
			result.current.containerProps.onKeyDown();
			result.current.containerProps.onFocus();
		});
		expect(result.current.visible).toBe(true);
		act(() => {
			result.current.containerProps.onBlur();
		});
		expect(result.current.visible).toBe(false);
	});
});
