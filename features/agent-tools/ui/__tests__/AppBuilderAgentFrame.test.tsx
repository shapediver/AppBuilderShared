/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {createEvent, fireEvent, render} from "@testing-library/react";
import type {ReactNode} from "react";
import {useHostedAgentFrameStore} from "../../model/useHostedAgentFrameStore";
import AppBuilderAgentFrame from "../AppBuilderAgentFrame";

function renderFrame(ui: ReactNode) {
	return render(<MantineProvider>{ui}</MantineProvider>);
}

describe("AppBuilderAgentFrame", () => {
	beforeEach(() => {
		Element.prototype.setPointerCapture = jest.fn();
		Element.prototype.releasePointerCapture = jest.fn();
		useHostedAgentFrameStore.setState({frame: null});
	});

	it("publishes contentWindow on the hostedAgent frame store", async () => {
		const {findByTitle, unmount} = renderFrame(<AppBuilderAgentFrame />);

		const frame = (await findByTitle(
			"ShapeDiver agent",
		)) as HTMLIFrameElement;
		fireEvent.load(frame);

		expect(useHostedAgentFrameStore.getState().frame).toBe(
			frame.contentWindow,
		);

		unmount();
		expect(useHostedAgentFrameStore.getState().frame).toBeNull();
	});

	it("updates wrap size when the top-left handle is dragged up and left", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1200,
		});
		Object.defineProperty(window, "innerHeight", {
			configurable: true,
			value: 900,
		});
		const {getByLabelText} = renderFrame(<AppBuilderAgentFrame />);
		const wrap = getByLabelText("Resize agent")
			.parentElement as HTMLElement;
		wrap.getBoundingClientRect = () =>
			({
				width: 384,
				height: 512,
				top: 0,
				left: 0,
				right: 384,
				bottom: 512,
				x: 0,
				y: 0,
				toJSON: () => ({}),
			}) as DOMRect;

		const handle = getByLabelText("Resize agent");
		const down = createEvent.pointerDown(handle, {pointerId: 1});
		Object.assign(down, {clientX: 100, clientY: 400});
		fireEvent(handle, down);
		const move = createEvent.pointerMove(handle, {pointerId: 1});
		Object.assign(move, {clientX: 60, clientY: 370});
		fireEvent(handle, move);

		expect(wrap.style.width).toBe("424px");
		expect(wrap.style.height).toBe("542px");
	});

	it("caps resize to the clipping viewport instead of the window", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 2000,
		});
		Object.defineProperty(window, "innerHeight", {
			configurable: true,
			value: 2000,
		});
		const restore = mockClippingViewport({
			viewport: {width: 640, height: 480, top: 80, left: 40},
			anchor: {right: 664, bottom: 480, width: 384, height: 300},
		});
		try {
			const {getByLabelText} = renderFrame(
				<div data-testid="viewport" style={{overflow: "hidden"}}>
					<AppBuilderAgentFrame />
				</div>,
			);
			const wrap = getByLabelText("Resize agent")
				.parentElement as HTMLElement;
			// 90% / 70% of the 640x480 viewport, which is tighter than the
			// space to the viewport's top-left (624x400) and the window.
			expect(wrap.style.getPropertyValue("--agent-frame-max-width")).toBe(
				"576px",
			);
			expect(
				wrap.style.getPropertyValue("--agent-frame-max-height"),
			).toBe("336px");

			const handle = getByLabelText("Resize agent");
			dragHandle(handle, {x: 200, y: 300}, {x: -200, y: -100});

			const width = Number.parseFloat(wrap.style.width);
			const height = Number.parseFloat(wrap.style.height);
			expect(width).toBe(576);
			expect(height).toBe(336);
			// Anchored at right 664 / bottom 480, so the handle stays inside
			// the viewport that starts at (40, 80).
			expect(664 - width).toBeGreaterThanOrEqual(40);
			expect(480 - height).toBeGreaterThanOrEqual(80);
		} finally {
			restore();
		}
	});

	it("keeps the top-left handle inside the viewport and can shrink again", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 2000,
		});
		Object.defineProperty(window, "innerHeight", {
			configurable: true,
			value: 2000,
		});
		const restore = mockClippingViewport({
			viewport: {width: 1000, height: 800, top: 0, left: 0},
			anchor: {right: 300, bottom: 250, width: 280, height: 200},
		});
		try {
			const {getByLabelText} = renderFrame(
				<div data-testid="viewport" style={{overflow: "hidden"}}>
					<AppBuilderAgentFrame />
				</div>,
			);
			const wrap = getByLabelText("Resize agent")
				.parentElement as HTMLElement;
			// Open space (300x250) is tighter than 90% / 70% of the viewport
			// (900x560), so the handle stops on the viewport corner.
			expect(wrap.style.getPropertyValue("--agent-frame-max-width")).toBe(
				"300px",
			);
			expect(
				wrap.style.getPropertyValue("--agent-frame-max-height"),
			).toBe("250px");

			const handle = getByLabelText("Resize agent");
			dragHandle(handle, {x: 100, y: 100}, {x: -400, y: -400});
			expect(wrap.style.width).toBe("300px");
			expect(wrap.style.height).toBe("250px");

			dragHandle(handle, {x: 100, y: 100}, {x: 140, y: 130});
			expect(wrap.style.width).toBe("260px");
			expect(wrap.style.height).toBe("220px");
		} finally {
			restore();
		}
	});
});

function dragHandle(
	handle: HTMLElement,
	from: {x: number; y: number},
	to: {x: number; y: number},
) {
	const down = createEvent.pointerDown(handle, {pointerId: 1});
	Object.assign(down, {clientX: from.x, clientY: from.y});
	fireEvent(handle, down);
	const move = createEvent.pointerMove(handle, {pointerId: 1});
	Object.assign(move, {clientX: to.x, clientY: to.y});
	fireEvent(handle, move);
	const up = createEvent.pointerUp(handle, {pointerId: 1});
	Object.assign(up, {clientX: to.x, clientY: to.y});
	fireEvent(handle, up);
}

function mockClippingViewport(args: {
	viewport: {width: number; height: number; top: number; left: number};
	anchor: {right: number; bottom: number; width: number; height: number};
}): () => void {
	const original = HTMLElement.prototype.getBoundingClientRect;
	const viewportRect = domRect({
		width: args.viewport.width,
		height: args.viewport.height,
		top: args.viewport.top,
		left: args.viewport.left,
		right: args.viewport.left + args.viewport.width,
		bottom: args.viewport.top + args.viewport.height,
	});
	HTMLElement.prototype.getBoundingClientRect = function () {
		const element = this as HTMLElement;
		if (element.dataset.testid === "viewport") {
			return viewportRect;
		}
		if (element.querySelector("[aria-label='Resize agent']")) {
			const width = element.style.width
				? Number.parseFloat(element.style.width)
				: args.anchor.width;
			const height = element.style.height
				? Number.parseFloat(element.style.height)
				: args.anchor.height;
			return domRect({
				width,
				height,
				right: args.anchor.right,
				bottom: args.anchor.bottom,
				left: args.anchor.right - width,
				top: args.anchor.bottom - height,
			});
		}
		return domRect({
			width: 0,
			height: 0,
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
		});
	};
	return () => {
		HTMLElement.prototype.getBoundingClientRect = original;
	};
}

function domRect(partial: {
	width: number;
	height: number;
	top: number;
	left: number;
	right: number;
	bottom: number;
}): DOMRect {
	return {
		x: partial.left,
		y: partial.top,
		width: partial.width,
		height: partial.height,
		top: partial.top,
		left: partial.left,
		right: partial.right,
		bottom: partial.bottom,
		toJSON: () => ({}),
	} as DOMRect;
}
