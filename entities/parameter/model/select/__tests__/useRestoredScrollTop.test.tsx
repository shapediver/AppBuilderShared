/**
 * @jest-environment jsdom
 */
import {fireEvent, render, screen} from "@testing-library/react";
import {useRestoredScrollTop} from "../useRestoredScrollTop";

function List(props: {initial: number; save: (scrollTop: number) => void}) {
	const ref = useRestoredScrollTop(undefined, props.initial, props.save);
	return <div data-testid="list" ref={ref} />;
}

/** jsdom has no layout. Give the list a visible height. */
function makeVisible(element: HTMLElement) {
	Object.defineProperty(element, "clientHeight", {
		configurable: true,
		value: 200,
	});
}

describe("useRestoredScrollTop", () => {
	it("saves the last visible offset when the list unmounts", () => {
		const save = jest.fn();
		const view = render(<List initial={0} save={save} />);
		const list = screen.getByTestId("list");
		makeVisible(list);

		list.scrollTop = 320;
		fireEvent.scroll(list);
		view.unmount();

		expect(save).toHaveBeenCalledWith(320);
	});

	it("ignores the offset a hidden list reports", () => {
		const save = jest.fn();
		const view = render(<List initial={150} save={save} />);
		const list = screen.getByTestId("list");

		// Hidden (clientHeight 0): the browser reports 0.
		fireEvent.pointerDown(list);
		list.scrollTop = 0;
		fireEvent.scroll(list);
		view.unmount();

		expect(save).toHaveBeenCalledWith(150);
	});

	it("scrolls back to the saved offset on mount", () => {
		render(<List initial={240} save={jest.fn()} />);

		expect(screen.getByTestId("list").scrollTop).toBe(240);
	});
});
