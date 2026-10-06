/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {fireEvent, render, screen} from "@testing-library/react";
import type {ReactNode} from "react";
import AppBuilderIframeWidgetComponent from "../AppBuilderIframeWidgetComponent";

function renderFrame(ui: ReactNode) {
	return render(<MantineProvider>{ui}</MantineProvider>);
}

describe("AppBuilderIframeWidgetComponent", () => {
	it("embeds an http url", () => {
		renderFrame(
			<AppBuilderIframeWidgetComponent
				url="https://example.com/docs"
				title="Docs"
				height="40rem"
			/>,
		);
		const frame = screen.getByTitle("Docs");
		expect(frame).toHaveAttribute("src", "https://example.com/docs");
		expect(frame.parentElement).toHaveStyle({height: "40rem"});
		expect(
			screen.getByRole("status", {name: "Loading"}),
		).toBeInTheDocument();
		fireEvent.load(frame);
		expect(screen.queryByRole("status", {name: "Loading"})).toBeNull();
	});

	it("renders nothing for a javascript url", () => {
		const {container} = renderFrame(
			<AppBuilderIframeWidgetComponent url="javascript:alert(1)" />,
		);
		expect(container.querySelector("iframe")).toBeNull();
	});
});
