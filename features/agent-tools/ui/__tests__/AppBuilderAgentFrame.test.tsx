/**
 * @jest-environment jsdom
 */
import {fireEvent, render} from "@testing-library/react";
import AppBuilderAgentFrame from "../AppBuilderAgentFrame";

describe("AppBuilderAgentFrame", () => {
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
});
