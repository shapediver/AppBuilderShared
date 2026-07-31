/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {MantineProvider} from "@mantine/core";
import {render, screen} from "@testing-library/react";
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
					toolbarItem={{
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
});
