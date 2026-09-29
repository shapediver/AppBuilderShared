/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import {resolveToolbarRegistration} from "@AppBuilderLib/features/appbuilder/model/resolveToolbarRegistration";
import {MantineProvider} from "@mantine/core";
import {cleanup, render, screen} from "@testing-library/react";
import AppBuilderToolbar from "../AppBuilderToolbar";

let mockToolbarVisible = true;

jest.mock("../../model/useToolbarVisibility", () => ({
	useToolbarVisibility: () => ({
		visible: mockToolbarVisible,
		containerProps: {},
		reducedMotion: true,
		setMenuOpen: jest.fn(),
	}),
}));

jest.mock("../AppBuilderToolbarActionButton", () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock("../AppBuilderToolbarExportButton", () => ({
	__esModule: true,
	default: () => null,
}));

jest.mock("../AppBuilderToolbarPopoverButton", () => ({
	__esModule: true,
	default: () => null,
}));

const buttonRenderContext: ButtonRenderContext = {
	namespace: "default",
	executing: false,
	fullscreenId: "viewer-fullscreen-area",
};

const queuedChange = {
	values: {Length: 12},
	accept: () => Promise.resolve({}),
	reject: () => undefined,
	wait: Promise.resolve({}),
	executing: false,
	priority: -1,
	addValueChange: () => undefined,
	removeValueChange: () => ({isEmpty: false, removed: false}),
};

describe("AppBuilderToolbar accept/reject", () => {
	beforeEach(() => {
		mockToolbarVisible = true;
	});

	it("stays shown when accept/reject must remain available", () => {
		mockToolbarVisible = false;
		const toolbar = resolveToolbarRegistration({
			id: "bottom-toolbar",
			source: "definition",
			side: "bottom",
			align: "center",
			order: 0,
			visibility: "onMouseActivity",
			groups: [
				[
					{
						id: "first",
						type: "widgets",
						label: "First",
						props: {widgets: []},
					},
				],
			],
		});

		const {rerender} = render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={toolbar}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(screen.getByRole("toolbar", {hidden: true}).style.display).toBe(
			"none",
		);

		rerender(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={toolbar}
					buttonRenderContext={buttonRenderContext}
					forceVisible
				/>
			</MantineProvider>,
		);

		expect(screen.getByRole("toolbar").style.display).not.toBe("none");
	});

	it("renders accept and reject when a dependent namespace has queued changes", () => {
		const original = useShapeDiverStoreParameters.getState();
		useShapeDiverStoreParameters.setState({
			parameterChanges: {
				session_appbuilder: queuedChange,
			},
		});
		const toolbar = resolveToolbarRegistration({
			id: "bottom-toolbar",
			source: "definition",
			side: "bottom",
			align: "center",
			order: 0,
			visibility: "always",
			groups: [
				[
					{
						id: "accept-reject",
						type: "acceptReject",
						label: "Accept or reject changes",
						props: {},
					},
				],
			],
		});

		try {
			render(
				<MantineProvider>
					<AppBuilderToolbar
						toolbar={toolbar}
						buttonRenderContext={buttonRenderContext}
					/>
				</MantineProvider>,
			);

			expect(screen.getByRole("button", {name: "Accept"})).toBeTruthy();
			expect(screen.getByRole("button", {name: "Reject"})).toBeTruthy();
		} finally {
			cleanup();
			useShapeDiverStoreParameters.setState({
				parameterChanges: original.parameterChanges,
			});
		}
	});
});
