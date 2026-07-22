/**
 * @jest-environment jsdom
 */
import {ButtonRenderContext} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
import {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {MantineProvider} from "@mantine/core";
import {render, screen} from "@testing-library/react";
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
	default: ({toolbarItem}: {toolbarItem: {label?: string}}) => (
		<button>{toolbarItem.label}</button>
	),
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
});
