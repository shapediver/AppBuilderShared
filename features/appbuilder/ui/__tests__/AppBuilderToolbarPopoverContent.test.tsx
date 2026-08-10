/**
 * @jest-environment jsdom
 */
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import AppBuilderToolbarPopoverContent from "../AppBuilderToolbarPopoverContent";

jest.mock("@AppBuilderLib/entities/parameter/model/useParameters", () => ({
	useParameters: () => [],
}));

jest.mock("@AppBuilderLib/entities/output/model/useOutputs", () => ({
	useOutputs: () => [],
}));

jest.mock(
	"@AppBuilderLib/widgets/appbuilder/ui/AppBuilderWidgetsComponent",
	() => ({
		__esModule: true,
		default: ({widgets}: {widgets: unknown[]}) => (
			<div data-testid="toolbar-widgets">widgets: {widgets.length}</div>
		),
	}),
);

jest.mock(
	"@AppBuilderLib/widgets/appbuilder/ui/AppBuilderTabsComponent",
	() => ({
		__esModule: true,
		default: () => <div />,
	}),
);

jest.mock("../AppBuilderActionFromType", () => ({
	AppBuilderActionFromType: jest.fn(),
}));

const baseProps = {
	componentContext: {} as any,
	namespace: "namespace",
	fullscreenId: "fullscreen-root",
	actionDisabled: false,
	parameterProps: [],
	outputProps: [],
	menuStackProps: {},
	menuSectionStackProps: {},
	menuDividerProps: {},
};

describe("AppBuilderToolbarPopoverContent", () => {
	it("renders widget toolbar item labels as popover titles", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					item={{
						id: "details",
						type: "widgets",
						label: "Details",
						props: {
							widgets: [{type: "text", props: {text: "Hello"}}],
						},
					}}
				/>
			</MantineProvider>,
		);

		expect(screen.getByText("Details")).toBeTruthy();
		expect(screen.getByTestId("toolbar-widgets").textContent).toBe(
			"widgets: 1",
		);
	});

	it("calls onActionActivate when a toolbar menu action is clicked", () => {
		const {AppBuilderActionFromType} = jest.requireMock(
			"../AppBuilderActionFromType",
		);
		AppBuilderActionFromType.mockReturnValue(
			<button data-testid="menu-action">Import model state</button>,
		);
		const onActionActivate = jest.fn();

		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					onActionActivate={onActionActivate}
					toolbarItem={{
						type: "actionMenu",
						props: {
							sections: [
								[
									{
										type: "action",
										id: "import-model-state",
										props: {
											definition: {
												type: "importModelState",
												props: {},
											},
										},
									},
								],
							],
						},
					}}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByTestId("menu-action"));

		expect(onActionActivate).toHaveBeenCalledTimes(1);
	});
});
