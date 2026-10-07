/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import type {ReactNode} from "react";
import AppBuilderIframeWidgetComponent from "../AppBuilderIframeWidgetComponent";

function renderFrame(ui: ReactNode) {
	return render(<MantineProvider>{ui}</MantineProvider>);
}

describe("AppBuilderIframeWidgetComponent", () => {
	it("embeds an http url", async () => {
		renderFrame(
			<AppBuilderIframeWidgetComponent
				url="https://example.com/docs"
				title="Docs"
				height="40rem"
			/>,
		);
		const frame = await screen.findByTitle("Docs");
		expect(frame).toHaveAttribute("src", "https://example.com/docs");
		expect(frame.parentElement).toHaveStyle({height: "40rem"});
		expect(
			screen.getByRole("status", {name: "Loading"}),
		).toBeInTheDocument();
		fireEvent.load(frame);
		expect(screen.queryByRole("status", {name: "Loading"})).toBeNull();
	});

	it("renders nothing for a javascript url", async () => {
		const {container} = renderFrame(
			<AppBuilderIframeWidgetComponent url="javascript:alert(1)" />,
		);
		await waitFor(() => {
			expect(
				screen.queryByRole("status", {name: "Loading"}),
			).toBeNull();
		});
		expect(container.querySelector("iframe")).toBeNull();
	});

	it("calls onLoad with the frame window, then null on unmount", async () => {
		const onLoad = jest.fn();
		const {unmount} = renderFrame(
			<AppBuilderIframeWidgetComponent
				url="http://localhost:3001"
				title="Agent"
				onLoad={onLoad}
			/>,
		);
		const frame = (await screen.findByTitle("Agent")) as HTMLIFrameElement;
		fireEvent.load(frame);
		expect(onLoad).toHaveBeenCalledWith(frame.contentWindow);
		unmount();
		expect(onLoad).toHaveBeenLastCalledWith(null);
	});
});
