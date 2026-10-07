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
});
