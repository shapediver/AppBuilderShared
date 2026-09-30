/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {cleanup, render, screen} from "@testing-library/react";
import ParameterLabelComponent from "../ParameterLabelComponent";
import ParameterWrapperComponent from "../ParameterWrapperComponent";

let mockDirty = true;

jest.mock("../../model/useParameter", () => ({
	useParameter: () => ({
		definition: {
			id: "Length",
			name: "Length",
			displayname: "Length",
		},
		actions: {execute: jest.fn()},
		state: {dirty: mockDirty, uiValue: "2", commitValue: "1"},
		acceptRejectMode: true,
	}),
}));

jest.mock("../AcceptRejectButtons", () => ({
	__esModule: true,
	default: () => <button type="button">Accept</button>,
}));

const renderLabel = (presentation: "global" | "inline" | undefined) =>
	render(
		<MantineProvider>
			<ParameterLabelComponent
				namespace="session"
				parameterId="Length"
				acceptRejectMode
				acceptRejectModePresentation={presentation}
				cancel={jest.fn()}
			/>
		</MantineProvider>,
	);

describe("ParameterLabelComponent accept/reject presentation", () => {
	beforeEach(() => {
		mockDirty = true;
	});

	afterEach(() => {
		cleanup();
	});

	it("keeps the shared dirty marker when presentation is global", () => {
		renderLabel("global");

		expect(screen.queryByRole("button", {name: "Accept"})).toBeNull();
		expect(screen.getByText("Length *")).toBeTruthy();
	});

	it("treats an omitted presentation as global", () => {
		renderLabel(undefined);

		expect(screen.queryByRole("button", {name: "Accept"})).toBeNull();
		expect(screen.getByText("Length *")).toBeTruthy();
	});

	it("keeps the historical label when presentation is inline", () => {
		renderLabel("inline");

		expect(screen.queryByRole("button", {name: "Accept"})).toBeNull();
		expect(screen.queryByRole("button", {name: "Reject"})).toBeNull();
		expect(screen.getByText("Length")).toBeTruthy();
		expect(screen.queryByText("Length *")).toBeNull();
	});

	it("renders inline accept/reject inside the parameter control when it is dirty", () => {
		const {container} = render(
			<MantineProvider>
				<ParameterWrapperComponent>
					<ParameterLabelComponent
						namespace="session"
						parameterId="Length"
						acceptRejectMode
						acceptRejectModePresentation="inline"
						cancel={jest.fn()}
					/>
				</ParameterWrapperComponent>
			</MantineProvider>,
		);

		const accept = screen.getByRole("button", {name: "Accept"});
		const section = container.querySelector("section");
		expect(section?.contains(accept)).toBe(true);
		expect(
			screen.getByText("Length").compareDocumentPosition(accept) &
				Node.DOCUMENT_POSITION_FOLLOWING,
		).toBeTruthy();
	});

	it("hides inline accept/reject when the parameter has nothing queued", () => {
		mockDirty = false;
		render(
			<MantineProvider>
				<ParameterWrapperComponent>
					<ParameterLabelComponent
						namespace="session"
						parameterId="Length"
						acceptRejectMode
						acceptRejectModePresentation="inline"
						cancel={jest.fn()}
					/>
				</ParameterWrapperComponent>
			</MantineProvider>,
		);

		expect(screen.queryByRole("button", {name: "Accept"})).toBeNull();
	});
});
