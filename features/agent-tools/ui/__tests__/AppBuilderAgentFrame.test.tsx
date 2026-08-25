/**
 * @jest-environment jsdom
 */
import {createEvent, fireEvent, render} from "@testing-library/react";
import AppBuilderAgentFrame from "../AppBuilderAgentFrame";

describe("AppBuilderAgentFrame", () => {
	beforeEach(() => {
		Element.prototype.setPointerCapture = jest.fn();
		Element.prototype.releasePointerCapture = jest.fn();
	});

	it("reports contentWindow on load", () => {
		const onPeerWindow = jest.fn();
		const {getByTitle, unmount} = render(
			<AppBuilderAgentFrame
				src="http://localhost:3001/app"
				onPeerWindow={onPeerWindow}
			/>,
		);

		const frame = getByTitle("ShapeDiver agent") as HTMLIFrameElement;
		fireEvent.load(frame);

		expect(onPeerWindow).toHaveBeenCalledWith(frame.contentWindow);

		unmount();
		expect(onPeerWindow).toHaveBeenCalledWith(null);
	});

	it("updates wrap size when the bottom-left handle is dragged", () => {
		Object.defineProperty(window, "innerWidth", {
			configurable: true,
			value: 1200,
		});
		Object.defineProperty(window, "innerHeight", {
			configurable: true,
			value: 900,
		});
		const {getByLabelText, getByTitle} = render(
			<AppBuilderAgentFrame
				src="http://localhost:3001/app"
				onPeerWindow={jest.fn()}
			/>,
		);
		const wrap = getByTitle("ShapeDiver agent").parentElement as HTMLElement;
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
		Object.assign(move, {clientX: 60, clientY: 430});
		fireEvent(handle, move);

		expect(wrap.style.width).toBe("424px");
		expect(wrap.style.height).toBe("542px");
	});
});
