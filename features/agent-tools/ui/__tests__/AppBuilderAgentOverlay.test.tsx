/**
 * @jest-environment jsdom
 */
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {MantineProvider} from "@mantine/core";
import "@testing-library/jest-dom";
import {render} from "@testing-library/react";
import type {ReactElement, ReactNode} from "react";
import AppBuilderAgentOverlay from "../AppBuilderAgentOverlay";

function DummyOverlay({children}: {children?: ReactNode}): ReactElement {
	return <div data-testid="overlay">{children}</div>;
}

const overlayContext = {
	viewportOverlayWrapper: {component: DummyOverlay},
};

const hiddenPanel = {
	mode: "iframe" as const,
	panelMounted: false,
	panelVisible: false,
	onPeerWindow: jest.fn(),
};

function renderOverlay(ui: ReactElement) {
	return render(<MantineProvider>{ui}</MantineProvider>);
}

describe("AppBuilderAgentOverlay", () => {
	it("renders nothing until the iframe has been opened", () => {
		const {queryByTitle} = renderOverlay(
			<AppBuilderAgentOverlay
				{...hiddenPanel}
				agentUrl="http://localhost:3001/app"
			/>,
		);
		expect(queryByTitle("ShapeDiver agent")).toBeNull();
	});

	it("renders nothing in window mode", () => {
		const {queryByTitle} = renderOverlay(
			<AppBuilderAgentOverlay
				{...hiddenPanel}
				mode="window"
				panelMounted
				panelVisible
				agentUrl="http://localhost:3001/app"
			/>,
		);
		expect(queryByTitle("ShapeDiver agent")).toBeNull();
	});

	it("keeps the iframe mounted while the panel is hidden", () => {
		const {queryByTitle} = renderOverlay(
			<ComponentContext.Provider value={overlayContext}>
				<AppBuilderAgentOverlay
					{...hiddenPanel}
					agentUrl="http://localhost:3001/app"
					panelMounted
					panelVisible={false}
				/>
			</ComponentContext.Provider>,
		);
		const iframe = queryByTitle("ShapeDiver agent");
		expect(iframe).toBeInTheDocument();
		let slot = iframe?.parentElement ?? null;
		while (slot && slot.style.display !== "none") {
			slot = slot.parentElement;
		}
		expect(slot).toHaveStyle({display: "none"});
	});

	it("shows the iframe while the panel is visible", () => {
		const {getByTitle} = renderOverlay(
			<AppBuilderAgentOverlay
				{...hiddenPanel}
				agentUrl="http://localhost:3001/app"
				panelMounted
				panelVisible
			/>,
		);
		expect(getByTitle("ShapeDiver agent")).toBeInTheDocument();
	});
});
