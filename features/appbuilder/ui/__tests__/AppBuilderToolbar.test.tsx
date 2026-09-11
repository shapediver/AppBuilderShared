/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {resolveToolbarRegistration} from "@AppBuilderLib/features/appbuilder/model/resolveToolbarRegistration";
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import AppBuilderToolbar from "../AppBuilderToolbar";

jest.mock("@mantine/core", () => {
	const actual = jest.requireActual("@mantine/core");
	const React = jest.requireActual("react");

	return {
		...actual,
		Divider: ({orientation, ...props}: {orientation?: string}) =>
			React.createElement("div", {
				...props,
				role: "separator",
				"data-orientation": orientation,
			}),
	};
});

jest.mock("../../model/useToolbarVisibility", () => ({
	useToolbarVisibility: () => ({
		visible: true,
		containerProps: {},
		reducedMotion: true,
		setMenuOpen: jest.fn(),
	}),
}));

jest.mock("../AppBuilderToolbarActionButton", () => ({
	__esModule: true,
	default: () => <div data-testid="toolbar-action" />,
}));

jest.mock("../AppBuilderToolbarExportButton", () => ({
	__esModule: true,
	default: () => <div data-testid="toolbar-export" />,
}));

jest.mock("../AppBuilderToolbarCommandButton", () => ({
	__esModule: true,
	default: ({
		item,
		globalDisabled,
	}: {
		item: {
			label?: string;
			type?: string;
			disabled?: boolean;
			props?: {execute?: () => void};
		};
		globalDisabled?: boolean;
	}) => (
		<button
			data-testid={`toolbar-command-${item.type ?? "command"}`}
			data-disabled={String(!!(item.disabled || globalDisabled))}
			disabled={!!(item.disabled || globalDisabled)}
			onClick={() => item.props?.execute?.()}
		>
			{item.label}
		</button>
	),
}));

jest.mock(
	"@AppBuilderLib/widgets/appbuilder/ui/ViewportAcceptRejectButtons",
	() => ({
		__esModule: true,
		default: () => <div data-testid="toolbar-accept-reject" />,
	}),
);

jest.mock("../AppBuilderToolbarPopoverButton", () => ({
	__esModule: true,
	default: ({
		item,
		popoverId,
		openedPopoverId,
		onPopoverOpenChange,
		popoverDismissalBlocked,
	}: {
		item: {label?: string};
		popoverId: string;
		openedPopoverId?: string;
		onPopoverOpenChange: (popoverId: string, open: boolean) => void;
		popoverDismissalBlocked: boolean;
	}) => {
		const opened = openedPopoverId === popoverId;

		return (
			<button
				data-popover-id={popoverId}
				data-popover-dismissal-blocked={String(popoverDismissalBlocked)}
				data-open={String(opened)}
				onClick={() => onPopoverOpenChange(popoverId, !opened)}
			>
				{item.label}
			</button>
		);
	},
}));

const buttonRenderContext: ButtonRenderContext = {
	namespace: "default",
	executing: false,
	fullscreenId: "viewer-fullscreen-area",
};

const createToolbar = (side: ToolbarRegistration["side"]) =>
	resolveToolbarRegistration({
		id: `${side}-toolbar`,
		source: "definition",
		side,
		align: "center",
		order: 0,
		visibility: "always",
		groups: [
			[
				{
					id: "first",
					type: "widgets",
					label: "First",
					props: {widgets: []},
				},
			],
			[
				{
					id: "second",
					type: "widgets",
					label: "Second",
					props: {widgets: []},
				},
			],
		],
	});

describe("AppBuilderToolbar", () => {
	beforeEach(() => {
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {},
		});
	});

	it("uses horizontal dividers between groups in vertical toolbars", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("left")}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const separator = screen.getByRole("separator");
		expect(separator.getAttribute("data-orientation")).toBe("horizontal");
		expect((separator as HTMLElement).style.width).toBe("60%");
		expect((separator as HTMLElement).style.alignSelf).toBe("center");
	});

	it("uses vertical dividers between groups in horizontal toolbars", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const separator = screen.getByRole("separator");
		expect(separator.getAttribute("data-orientation")).toBe("vertical");
		expect((separator as HTMLElement).style.alignSelf).toBe("stretch");
	});

	it("uses a vertical toolbar layout on the right side", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("right")}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(
			screen.getByRole("toolbar").getAttribute("aria-orientation"),
		).toBe("vertical");
		expect(
			screen.getByRole("separator").getAttribute("data-orientation"),
		).toBe("horizontal");
	});

	it("keeps an open popover when interacting with nested portal dropdowns", () => {
		const toolbar = createToolbar("top");

		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={toolbar}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);
		expect(firstButton.getAttribute("data-open")).toBe("true");

		const nestedPopoverDropdown = document.createElement("div");
		nestedPopoverDropdown.setAttribute("role", "dialog");
		nestedPopoverDropdown.setAttribute("data-position", "bottom");
		document.body.appendChild(nestedPopoverDropdown);
		fireEvent.pointerDown(nestedPopoverDropdown);

		expect(firstButton.getAttribute("data-open")).toBe("true");
	});

	it("keeps an open popover when interacting with the color picker portal", () => {
		const toolbar = createToolbar("top");

		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={toolbar}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);
		expect(firstButton.getAttribute("data-open")).toBe("true");

		const colorPickerDropdown = document.createElement("div");
		colorPickerDropdown.setAttribute("data-position", "bottom-start");
		document.body.appendChild(colorPickerDropdown);
		fireEvent.pointerDown(colorPickerDropdown);

		expect(firstButton.getAttribute("data-open")).toBe("true");
	});

	it("keeps an open popover when interacting with a Mantine Modal portal", () => {
		const toolbar = createToolbar("top");

		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={toolbar}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);
		expect(firstButton.getAttribute("data-open")).toBe("true");

		// Mantine `Modal` content carries `role="dialog"` but no `data-position`.
		// Clicking inside it (e.g. the "Import model state" dialog opened from a
		// toolbar menu item) must not close the toolbar popover, otherwise the
		// action component owning the dialog state unmounts and the dialog
		// disappears on any inside click.
		const modalContent = document.createElement("div");
		modalContent.setAttribute("role", "dialog");
		modalContent.setAttribute("aria-modal", "true");
		document.body.appendChild(modalContent);
		fireEvent.pointerDown(modalContent);

		expect(firstButton.getAttribute("data-open")).toBe("true");
	});

	it("closes an open popover on true outside clicks", () => {
		const toolbar = createToolbar("top");

		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={toolbar}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);
		expect(firstButton.getAttribute("data-open")).toBe("true");

		const outside = document.createElement("div");
		document.body.appendChild(outside);
		fireEvent.pointerDown(outside);

		expect(firstButton.getAttribute("data-open")).toBe("false");
	});

	it("closes an open popover when the canvas is clicked during an interaction", () => {
		const toolbar = createToolbar("top");
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {
				viewer: {
					activeRequest: {
						type: "active",
						viewportId: "viewer",
						token: "active-request",
						disable: jest.fn(),
					},
					passiveRequests: [],
				},
			},
		});

		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={toolbar}
					buttonRenderContext={{
						...buttonRenderContext,
						viewportId: "viewer",
					}}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);
		expect(firstButton.getAttribute("data-open")).toBe("true");
		expect(firstButton.getAttribute("data-popover-dismissal-blocked")).toBe(
			"true",
		);

		const canvas = document.createElement("canvas");
		document.body.appendChild(canvas);
		fireEvent.pointerDown(canvas);

		expect(firstButton.getAttribute("data-open")).toBe("false");
	});

	it("keeps an open popover when clicking inside the toolbar", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);
		fireEvent.pointerDown(firstButton);

		expect(firstButton.getAttribute("data-open")).toBe("true");
	});

	it("keeps an open popover when interacting with a toolbar popover portal", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);

		const popoverPortal = document.createElement("div");
		popoverPortal.setAttribute("data-appbuilder-toolbar-popover", "true");
		document.body.appendChild(popoverPortal);
		fireEvent.pointerDown(popoverPortal);

		expect(firstButton.getAttribute("data-open")).toBe("true");
	});

	it("does not close on a non-element pointer target", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);

		const textNode = document.createTextNode("outside");
		document.body.appendChild(textNode);
		expect(() => fireEvent.pointerDown(textNode)).not.toThrow();

		expect(firstButton.getAttribute("data-open")).toBe("false");
	});

	it("closes an open popover when a canvas descendant is clicked", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);

		const canvas = document.createElement("canvas");
		const overlay = document.createElement("div");
		canvas.appendChild(overlay);
		document.body.appendChild(canvas);
		fireEvent.pointerDown(overlay);

		expect(firstButton.getAttribute("data-open")).toBe("false");
	});

	it("does not dismiss a blocked popover on a non-canvas outside click", () => {
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {
				viewer: {
					activeRequest: {
						type: "active",
						viewportId: "viewer",
						token: "active-request",
						disable: jest.fn(),
					},
					passiveRequests: [],
				},
			},
		});

		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={{
						...buttonRenderContext,
						viewportId: "viewer",
					}}
				/>
			</MantineProvider>,
		);

		const firstButton = screen.getByRole("button", {name: "First"});
		fireEvent.click(firstButton);
		expect(firstButton.getAttribute("data-popover-dismissal-blocked")).toBe(
			"true",
		);

		const outside = document.createElement("div");
		document.body.appendChild(outside);
		fireEvent.pointerDown(outside);

		expect(firstButton.getAttribute("data-open")).toBe("true");
	});

	it("blocks dismissal when any viewport has an active request", () => {
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {
				other: {
					activeRequest: {
						type: "active",
						viewportId: "other",
						token: "active-request",
						disable: jest.fn(),
					},
					passiveRequests: [],
				},
			},
		});

		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(
			screen
				.getByRole("button", {name: "First"})
				.getAttribute("data-popover-dismissal-blocked"),
		).toBe("true");
	});

	it("does not block dismissal for a different viewport's request", () => {
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {
				other: {
					activeRequest: {
						type: "active",
						viewportId: "other",
						token: "active-request",
						disable: jest.fn(),
					},
					passiveRequests: [],
				},
			},
		});

		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={{
						...buttonRenderContext,
						viewportId: "viewer",
					}}
				/>
			</MantineProvider>,
		);

		expect(
			screen
				.getByRole("button", {name: "First"})
				.getAttribute("data-popover-dismissal-blocked"),
		).toBe("false");
	});

	it("renders each resolved toolbar item type", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={{
						id: "mixed",
						source: "definition",
						side: "top",
						align: "center",
						order: 0,
						visibility: "always",
						groups: [
							[
								{
									id: "accept",
									type: "acceptReject",
									label: "Accept",
									props: {},
								},
								{
									id: "cmd",
									type: "command",
									label: "Run",
									props: {execute: jest.fn()},
								},
								{
									id: "check",
									type: "checkbox",
									label: "Toggle",
									props: {
										checked: false,
										setChecked: jest.fn(),
									},
								},
								{
									id: "act",
									type: "action",
									label: "Action",
									props: {
										definition: {
											type: "undo",
											props: {},
										},
									},
								},
								{
									id: "exp",
									type: "export",
									label: "Export",
									props: {name: "stl"},
								},
							],
						],
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(screen.getByTestId("toolbar-accept-reject")).toBeTruthy();
		expect(screen.getByText("Run")).toBeTruthy();
		expect(screen.getByText("Toggle")).toBeTruthy();
		expect(screen.getByTestId("toolbar-action")).toBeTruthy();
		expect(screen.getByTestId("toolbar-export")).toBeTruthy();
	});

	it("applies theme style overrides to the toolbar paper", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={createToolbar("top")}
					buttonRenderContext={buttonRenderContext}
					themePropsOverride={{
						style: {backgroundColor: "rgb(12, 34, 56)"},
					}}
				/>
			</MantineProvider>,
		);

		const toolbar = screen.getByRole("toolbar");
		expect(toolbar.style.pointerEvents).toBe("auto");
		expect(toolbar.style.backgroundColor).toBe("rgb(12, 34, 56)");
	});

	it("falls back to a generated popover id when an item omits id", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={{
						id: "noid",
						source: "definition",
						side: "top",
						align: "center",
						order: 0,
						visibility: "always",
						groups: [
							[
								{
									type: "widgets",
									label: "NoId",
									props: {widgets: []},
								} as never,
							],
						],
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(
			screen
				.getByRole("button", {name: "NoId"})
				.getAttribute("data-popover-id"),
		).toBe("0-0");
	});

	it("disables toolbar commands while an action is executing", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={{
						id: "cmd",
						source: "definition",
						side: "top",
						align: "center",
						order: 0,
						visibility: "always",
						groups: [
							[
								{
									id: "run",
									type: "command",
									label: "Run",
									props: {execute: jest.fn()},
								},
							],
						],
					}}
					buttonRenderContext={{
						...buttonRenderContext,
						executing: true,
					}}
				/>
			</MantineProvider>,
		);

		expect(
			(screen.getByRole("button", {name: "Run"}) as HTMLButtonElement)
				.disabled,
		).toBe(true);
	});

	it("toggles a checkbox item and honors readOnly", () => {
		const setChecked = jest.fn();
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={{
						id: "checks",
						source: "definition",
						side: "top",
						align: "center",
						order: 0,
						visibility: "always",
						groups: [
							[
								{
									id: "on",
									type: "checkbox",
									label: "On",
									props: {
										checked: false,
										setChecked,
									},
								},
								{
									id: "locked",
									type: "checkbox",
									label: "Locked",
									props: {
										checked: true,
										readOnly: true,
										setChecked: jest.fn(),
									},
								},
							],
						],
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "On"}));
		expect(setChecked).toHaveBeenCalledWith(true);
		expect(
			(screen.getByRole("button", {name: "Locked"}) as HTMLButtonElement)
				.disabled,
		).toBe(true);
	});

	it("renders one fewer separator than visible groups", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={{
						id: "one",
						source: "definition",
						side: "top",
						align: "center",
						order: 0,
						visibility: "always",
						groups: [
							[
								{
									id: "only",
									type: "widgets",
									label: "Only",
									props: {widgets: []},
								},
							],
						],
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(screen.queryByRole("separator")).toBeNull();
	});

	it("renders separators only between visible groups", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbar
					toolbar={{
						id: "three",
						source: "definition",
						side: "top",
						align: "center",
						order: 0,
						visibility: "always",
						groups: [
							[
								{
									id: "a",
									type: "widgets",
									label: "A",
									props: {widgets: []},
								},
							],
							[],
							[
								{
									id: "b",
									type: "widgets",
									label: "B",
									props: {widgets: []},
								},
							],
							[
								{
									id: "c",
									type: "widgets",
									label: "C",
									props: {widgets: []},
								},
							],
						],
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(screen.getAllByRole("separator")).toHaveLength(2);
	});
});
