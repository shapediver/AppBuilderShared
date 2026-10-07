/**
 * @jest-environment jsdom
 */

jest.mock("@AppBuilderLib/shared/lib/platform/environment", () => ({
	...jest.requireActual("@AppBuilderLib/shared/lib/platform/environment"),
	getEnvironmentIdentifier: jest.fn(() => "localhost"),
}));

import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {getEnvironmentIdentifier} from "@AppBuilderLib/shared/lib/platform/environment";
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {fireEvent, render, screen} from "@testing-library/react";
import type {ReactNode} from "react";
import {useHostedAgentFrameStore} from "../../model/useHostedAgentFrameStore";
import AppBuilderHostedAgentWidgetComponent from "../AppBuilderHostedAgentWidgetComponent";

function renderWidget(ui: ReactNode) {
	return render(<MantineProvider>{ui}</MantineProvider>);
}

describe("AppBuilderHostedAgentWidgetComponent", () => {
	beforeEach(() => {
		window.history.replaceState({}, "", "/");
		useHostedAgentFrameStore.setState({frame: null});
		jest.mocked(getEnvironmentIdentifier)
			.mockReset()
			.mockReturnValue("localhost");
	});

	it("embeds the environment agent url without a url prop", async () => {
		renderWidget(<AppBuilderHostedAgentWidgetComponent height="100%" />);
		const frame = await screen.findByTitle("ShapeDiver agent");
		expect(frame).toHaveAttribute("src", "http://localhost:3001/");
	});

	it("uses a custom title", async () => {
		renderWidget(
			<AppBuilderHostedAgentWidgetComponent title="Bookshelf agent" />,
		);
		expect(await screen.findByTitle("Bookshelf agent")).toBeInTheDocument();
	});

	it("query agentUrl wins on localhost", async () => {
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://localhost:3001/app`,
		);
		renderWidget(<AppBuilderHostedAgentWidgetComponent />);
		expect(await screen.findByTitle("ShapeDiver agent")).toHaveAttribute(
			"src",
			"http://localhost:3001/app",
		);
	});

	it("registers contentWindow, then clears it on unmount", async () => {
		const {unmount} = renderWidget(
			<AppBuilderHostedAgentWidgetComponent title="Agent" />,
		);
		const frame = (await screen.findByTitle("Agent")) as HTMLIFrameElement;
		fireEvent.load(frame);
		expect(useHostedAgentFrameStore.getState().frame).toBe(
			frame.contentWindow,
		);
		unmount();
		expect(useHostedAgentFrameStore.getState().frame).toBeNull();
	});

	it("renders nothing when no agent url is resolved", async () => {
		jest.mocked(getEnvironmentIdentifier).mockReturnValue("unknown");
		const {container} = renderWidget(
			<AppBuilderHostedAgentWidgetComponent />,
		);
		expect(container.querySelector("iframe")).toBeNull();
	});
});
