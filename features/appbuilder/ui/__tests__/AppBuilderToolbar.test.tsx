/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreInteractionRequestManagement} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreInteractionRequestManagement";
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
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

jest.mock("../AppBuilderToolbarButton", () => ({
	__esModule: true,
	default: ({
		toolbarItem,
		popoverId,
		openedPopoverId,
		onPopoverOpenChange,
		hasActiveInteractionRequest,
	}: {
		toolbarItem: {label?: string};
		popoverId: string;
		openedPopoverId?: string;
		onPopoverOpenChange: (popoverId: string, open: boolean) => void;
		hasActiveInteractionRequest: boolean;
	}) => {
		const opened = openedPopoverId === popoverId;

		return (
			<button
				data-active-interaction={String(hasActiveInteractionRequest)}
				data-open={String(opened)}
				onClick={() => onPopoverOpenChange(popoverId, !opened)}
			>
				{toolbarItem.label}
			</button>
		);
	},
}));

const buttonRenderContext: ButtonRenderContext = {
	namespace: "default",
	buttonsDisabled: false,
	executing: false,
	hasPendingChanges: false,
	fullscreenId: "viewer-fullscreen-area",
};

const createToolbar = (
	side: ToolbarRegistration["side"],
): ToolbarRegistration => ({
	id: `${side}-toolbar`,
	source: "definition",
	side,
	align: "center",
	order: 0,
	visibility: "always",
	groups: [
		[{id: "first", label: "First"}],
		[{id: "second", label: "Second"}],
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

		expect(
			screen.getByRole("separator").getAttribute("data-orientation"),
		).toBe("horizontal");
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

		expect(
			screen.getByRole("separator").getAttribute("data-orientation"),
		).toBe("vertical");
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

	it("keeps an open popover while a viewport interaction request is active", () => {
		const toolbar = createToolbar("top");
		const disable = jest.fn();
		useShapeDiverStoreInteractionRequestManagement.setState({
			interactionRequests: {
				viewer: {
					activeRequest: {
						type: "active",
						viewportId: "viewer",
						token: "active-token",
						disable,
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
		expect(firstButton.getAttribute("data-active-interaction")).toBe(
			"true",
		);

		const canvas = document.createElement("canvas");
		document.body.appendChild(canvas);
		fireEvent.pointerDown(canvas);

		expect(firstButton.getAttribute("data-open")).toBe("true");
		expect(disable).not.toHaveBeenCalled();
	});
});
