/**
 * @jest-environment jsdom
 */
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {fireEvent, render} from "@testing-library/react";
import type {ReactElement, ReactNode} from "react";
import AppBuilderAgentOverlay from "../AppBuilderAgentOverlay";

function DummyOverlay({children}: {children?: ReactNode}): ReactElement {
	return <div data-testid="overlay">{children}</div>;
}

const overlayContext = {
	viewportOverlayWrapper: {component: DummyOverlay},
};

const idleProps = {
	agentOpen: false,
	snapshotComplete: true,
	onOpen: jest.fn(),
	onPeerWindow: jest.fn(),
};

describe("AppBuilderAgentOverlay", () => {
	beforeEach(() => {
		idleProps.onOpen.mockReset();
		idleProps.onPeerWindow.mockReset();
	});

	it("renders nothing without agentUrl", () => {
		const {queryByTestId, queryByRole} = render(
			<MantineProvider>
				<ComponentContext.Provider value={overlayContext}>
					<AppBuilderAgentOverlay {...idleProps} />
				</ComponentContext.Provider>
			</MantineProvider>,
		);
		expect(queryByTestId("overlay")).toBeNull();
		expect(queryByRole("button")).toBeNull();
	});

	it("renders nothing without overlay wrapper", () => {
		const {queryByRole} = render(
			<MantineProvider>
				<AppBuilderAgentOverlay
					{...idleProps}
					agentUrl="http://localhost:3001/app"
				/>
			</MantineProvider>,
		);
		expect(queryByRole("button")).toBeNull();
	});

	it("disables Open agent until snapshotComplete", () => {
		const {getByRole} = render(
			<MantineProvider>
				<ComponentContext.Provider value={overlayContext}>
					<AppBuilderAgentOverlay
						{...idleProps}
						agentUrl="http://localhost:3001/app"
						snapshotComplete={false}
					/>
				</ComponentContext.Provider>
			</MantineProvider>,
		);
		expect(getByRole("button", {name: "Open agent"})).toBeDisabled();
	});

	it("calls onOpen when Open agent is clicked", () => {
		const {getByRole} = render(
			<MantineProvider>
				<ComponentContext.Provider value={overlayContext}>
					<AppBuilderAgentOverlay
						{...idleProps}
						agentUrl="http://localhost:3001/app"
					/>
				</ComponentContext.Provider>
			</MantineProvider>,
		);
		fireEvent.click(getByRole("button", {name: "Open agent"}));
		expect(idleProps.onOpen).toHaveBeenCalledTimes(1);
	});

	it("shows the agent frame when open", () => {
		const {getByTitle} = render(
			<MantineProvider>
				<ComponentContext.Provider value={overlayContext}>
					<AppBuilderAgentOverlay
						{...idleProps}
						agentUrl="http://localhost:3001/app"
						agentOpen={true}
					/>
				</ComponentContext.Provider>
			</MantineProvider>,
		);
		const frame = getByTitle("ShapeDiver agent") as HTMLIFrameElement;
		fireEvent.load(frame);
		expect(idleProps.onPeerWindow).toHaveBeenCalledWith(frame.contentWindow);
	});
});
