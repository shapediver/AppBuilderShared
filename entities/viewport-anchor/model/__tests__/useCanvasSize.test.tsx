/**
 * @jest-environment jsdom
 */
import {act, renderHook} from "@testing-library/react";
import {useCanvasSize} from "../useCanvasSize";

describe("useCanvasSize", () => {
	const observers: Array<{
		callback: ResizeObserverCallback;
		target: Element | null;
	}> = [];

	beforeEach(() => {
		observers.length = 0;
		global.ResizeObserver = class {
			callback: ResizeObserverCallback;
			target: Element | null = null;

			constructor(callback: ResizeObserverCallback) {
				this.callback = callback;
				observers.push(this);
			}

			observe(target: Element) {
				this.target = target;
			}

			unobserve() {}

			disconnect() {
				this.target = null;
			}
		} as unknown as typeof ResizeObserver;
	});

	it("follows the canvas parent and ignores a screenshot resize of the canvas", () => {
		const parent = document.createElement("div");
		const canvas = document.createElement("canvas");
		parent.appendChild(canvas);
		Object.defineProperty(parent, "clientWidth", {
			configurable: true,
			get: () => 1920,
		});
		Object.defineProperty(parent, "clientHeight", {
			configurable: true,
			get: () => 1080,
		});
		document.body.appendChild(parent);

		const {result} = renderHook(() => useCanvasSize(canvas));

		expect(observers).toHaveLength(1);
		expect(observers[0].target).toBe(parent);
		expect(result.current).toEqual({width: 1920, height: 1080});

		canvas.style.width = "1024px";
		canvas.style.height = "1024px";
		act(() => {
			observers[0].callback(
				[],
				observers[0] as unknown as ResizeObserver,
			);
		});

		expect(result.current).toEqual({width: 1920, height: 1080});

		Object.defineProperty(parent, "clientWidth", {
			configurable: true,
			get: () => 800,
		});
		Object.defineProperty(parent, "clientHeight", {
			configurable: true,
			get: () => 600,
		});
		act(() => {
			observers[0].callback(
				[],
				observers[0] as unknown as ResizeObserver,
			);
		});

		expect(result.current).toEqual({width: 800, height: 600});
		parent.remove();
	});
});
