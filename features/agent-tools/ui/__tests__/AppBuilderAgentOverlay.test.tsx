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
	isAgentReady: true,
	onOpenAgent: jest.fn(),
};

function renderOverlay(ui: ReactElement, withWrapper = true) {
	return render(
		<MantineProvider>
			{withWrapper ? (
				<ComponentContext.Provider value={overlayContext}>
					{ui}
				</ComponentContext.Provider>
			) : (
				ui
			)}
		</MantineProvider>,
	);
}

describe("AppBuilderAgentOverlay", () => {
	beforeEach(() => {
		idleProps.onOpenAgent.mockReset();
	});

	it("renders nothing without agentUrl", () => {
		const {queryByTestId, queryByRole} = renderOverlay(
			<AppBuilderAgentOverlay {...idleProps} />,
		);
		expect(queryByTestId("overlay")).toBeNull();
		expect(queryByRole("button")).toBeNull();
	});

	it("renders nothing without overlay wrapper", () => {
		const {queryByRole} = renderOverlay(
			<AppBuilderAgentOverlay
				{...idleProps}
				agentUrl="http://localhost:3001/app"
			/>,
			false,
		);
		expect(queryByRole("button")).toBeNull();
	});

	it("disables Open agent until isAgentReady", () => {
		const {getByRole} = renderOverlay(
			<AppBuilderAgentOverlay
				{...idleProps}
				agentUrl="http://localhost:3001/app"
				isAgentReady={false}
			/>,
		);
		expect(getByRole("button", {name: "Open agent"})).toBeDisabled();
	});

	it("calls onOpenAgent when Open agent is clicked", () => {
		const {getByRole} = renderOverlay(
			<AppBuilderAgentOverlay
				{...idleProps}
				agentUrl="http://localhost:3001/app"
			/>,
		);
		fireEvent.click(getByRole("button", {name: "Open agent"}));
		expect(idleProps.onOpenAgent).toHaveBeenCalledTimes(1);
	});

	it("keeps the Open agent button and does not render an iframe", () => {
		const {getByRole, queryByTitle, queryByLabelText} = renderOverlay(
			<AppBuilderAgentOverlay
				{...idleProps}
				agentUrl="http://localhost:3001/app"
			/>,
		);
		expect(getByRole("button", {name: "Open agent"})).toBeInTheDocument();
		expect(queryByTitle("ShapeDiver agent")).toBeNull();
		expect(queryByLabelText("Resize agent")).toBeNull();
	});
});
