/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */

jest.mock("@AppBuilderLib/entities/viewport/model/useViewportControls", () => ({
	useViewportControls: () => ({
		showControls: false,
		setIsHoveringControls: jest.fn(),
	}),
}));

jest.mock("@shapediver/viewer.session", () => ({
	SystemInfo: {
		instance: {
			isMobile: false,
		},
	},
}));

import {act, renderHook} from "@testing-library/react";
import {useToolbarVisibility} from "../useToolbarVisibility";

describe("useToolbarVisibility", () => {
	it("always mode is always visible", () => {
		const {result} = renderHook(() =>
			useToolbarVisibility({mode: "always"}),
		);
		expect(result.current.visible).toBe(true);
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
});
