/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import AppBuilderToolbarPopoverContent from "../AppBuilderToolbarPopoverContent";

jest.mock("@AppBuilderLib/entities/parameter/model/useParameters", () => ({
	useParameters: jest.fn(() => []),
}));

jest.mock("@AppBuilderLib/entities/output/model/useOutputs", () => ({
	useOutputs: jest.fn(() => []),
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
		default: ({
			tabs,
			stickyTabs,
		}: {
			tabs: unknown[];
			stickyTabs?: boolean;
		}) => (
			<div data-testid="toolbar-tabs">
				tabs: {tabs.length} sticky:{String(!!stickyTabs)}
			</div>
		),
	}),
);

jest.mock("@AppBuilderLib/entities/output/ui/OutputStargateComponent", () => ({
	__esModule: true,
	default: ({outputId, namespace}: {outputId: string; namespace: string}) => (
		<div data-testid="toolbar-output">
			{namespace}:{outputId}
		</div>
	),
}));

jest.mock("../AppBuilderActionFromType", () => ({
	AppBuilderActionFromType: jest.fn(),
}));

jest.mock("../AppBuilderToolbarCommandButton", () => ({
	__esModule: true,
	default: ({
		item,
		globalDisabled,
		presentation,
	}: {
		item: {
			label: string;
			disabled?: boolean;
			props: {execute: () => void};
		};
		globalDisabled?: boolean;
		presentation: string;
	}) => (
		<button
			data-testid="popover-command"
			data-presentation={presentation}
			disabled={!!(item.disabled || globalDisabled)}
			onClick={() => item.props.execute()}
		>
			{item.label}
		</button>
	),
}));

jest.mock("../AppBuilderToolbarMenuCheckbox", () => ({
	__esModule: true,
	default: ({
		label,
		checked,
		disabled,
		readOnly,
		onChange,
		trailingAction,
	}: {
		label: string;
		checked: boolean;
		disabled?: boolean;
		readOnly?: boolean;
		onChange: () => void;
		trailingAction?: {
			label: string;
			disabled?: boolean;
			execute: () => void;
		};
	}) => (
		<div>
			<button
				data-testid="popover-checkbox"
				aria-checked={String(checked)}
				disabled={!!(disabled || readOnly)}
				onClick={onChange}
			>
				{label}
			</button>
			{trailingAction && (
				<button
					aria-label={trailingAction.label}
					disabled={trailingAction.disabled}
					onClick={trailingAction.execute}
				>
					{trailingAction.label}
				</button>
			)}
		</div>
	),
}));

const MockParameter = ({
	parameterId,
	disableIfDirty,
}: {
	parameterId: string;
	disableIfDirty?: boolean;
}) => (
	<div data-testid="toolbar-parameter">
		{parameterId}:{String(disableIfDirty)}
	</div>
);

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
	beforeEach(() => {
		const {useParameters} = jest.requireMock(
			"@AppBuilderLib/entities/parameter/model/useParameters",
		);
		const {useOutputs} = jest.requireMock(
			"@AppBuilderLib/entities/output/model/useOutputs",
		);
		useParameters.mockReturnValue([]);
		useOutputs.mockReturnValue([]);
	});

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
					viewportId="viewport-1"
					onActionActivate={onActionActivate}
					item={{
						id: "actions",
						type: "menu",
						label: "Actions",
						props: {
							sections: [
								{
									id: "actions",
									items: [
										{
											type: "action",
											id: "import-model-state",
											label: "Import model state",
											props: {
												definition: {
													type: "importModelState",
													props: {},
												},
											},
										},
									],
								},
							],
						},
					}}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByTestId("menu-action"));

		expect(onActionActivate).toHaveBeenCalledTimes(1);
		expect(AppBuilderActionFromType).toHaveBeenCalledWith(
			expect.objectContaining({
				definition: {type: "importModelState", props: {}},
			}),
			"namespace",
			"toolbar-menu-action-import-model-state",
			baseProps.componentContext,
			expect.objectContaining({
				presentation: "button",
				viewportId: "viewport-1",
				fullscreenId: "fullscreen-root",
			}),
		);
	});

	it("disables a menu action and uses its presentation", () => {
		const {AppBuilderActionFromType} = jest.requireMock(
			"../AppBuilderActionFromType",
		);
		AppBuilderActionFromType.mockReturnValue(
			<button data-testid="menu-action">Import model state</button>,
		);

		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					actionDisabled
					item={{
						id: "actions",
						type: "menu",
						label: "Actions",
						props: {
							sections: [
								{
									id: "actions",
									items: [
										{
											type: "action",
											id: "import-model-state",
											label: "Import model state",
											presentation: "item",
											disabled: true,
											props: {
												definition: {
													type: "importModelState",
													props: {},
												},
											},
										},
									],
								},
							],
						},
					}}
				/>
			</MantineProvider>,
		);

		expect(AppBuilderActionFromType).toHaveBeenCalledWith(
			expect.anything(),
			"namespace",
			"toolbar-menu-action-import-model-state",
			baseProps.componentContext,
			expect.objectContaining({
				presentation: "item",
				disabled: true,
			}),
		);
	});

	it("renders unlabeled widget panels without a title", () => {
		const {container} = render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					item={{
						id: "details",
						type: "widgets",
						label: "",
						props: {
							widgets: [{type: "text", props: {text: "Hello"}}],
						},
					}}
				/>
			</MantineProvider>,
		);

		expect(container.querySelector(".mantine-Text-root")).toBeNull();
		expect(screen.getByTestId("toolbar-widgets").textContent).toBe(
			"widgets: 1",
		);
	});

	it("runs a menu command and renders a checkbox", () => {
		const execute = jest.fn();
		const setChecked = jest.fn();
		const trailingExecute = jest.fn();

		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					item={{
						id: "menu",
						type: "menu",
						label: "Menu",
						props: {
							sections: [
								{
									id: "first",
									items: [
										{
											id: "run",
											type: "command",
											label: "Run",
											props: {execute},
										},
									],
								},
								{
									id: "second",
									items: [
										{
											id: "flag",
											type: "checkbox",
											label: "Flag",
											props: {
												checked: false,
												setChecked,
												trailingAction: {
													label: "Clear",
													icon: "tabler:x",
													execute: trailingExecute,
												},
											},
										},
									],
								},
							],
						},
					}}
				/>
			</MantineProvider>,
		);

		expect(screen.getByRole("separator")).toBeTruthy();
		expect(
			screen
				.getByTestId("popover-command")
				.getAttribute("data-presentation"),
		).toBe("menu");

		fireEvent.click(screen.getByRole("button", {name: "Run"}));
		expect(execute).toHaveBeenCalledTimes(1);

		expect(
			screen.getByTestId("popover-checkbox").getAttribute("aria-checked"),
		).toBe("false");
		fireEvent.click(screen.getByTestId("popover-checkbox"));
		expect(setChecked).toHaveBeenCalledWith(true);

		fireEvent.click(screen.getByRole("button", {name: "Clear"}));
		expect(trailingExecute).toHaveBeenCalledTimes(1);
	});

	it("disables menu commands, checkboxes, and trailing actions", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					actionDisabled
					item={{
						id: "menu",
						type: "menu",
						label: "Menu",
						props: {
							sections: [
								{
									id: "section",
									items: [
										{
											id: "run",
											type: "command",
											label: "Run",
											props: {execute: jest.fn()},
										},
										{
											id: "flag",
											type: "checkbox",
											label: "Flag",
											props: {
												checked: true,
												setChecked: jest.fn(),
												trailingAction: {
													label: "Clear",
													icon: "tabler:x",
													execute: jest.fn(),
												},
											},
										},
									],
								},
							],
						},
					}}
				/>
			</MantineProvider>,
		);

		expect(
			(screen.getByRole("button", {name: "Run"}) as HTMLButtonElement)
				.disabled,
		).toBe(true);
		expect(
			(screen.getByTestId("popover-checkbox") as HTMLButtonElement)
				.disabled,
		).toBe(true);
		expect(
			(screen.getByRole("button", {name: "Clear"}) as HTMLButtonElement)
				.disabled,
		).toBe(true);
	});

	it("renders toolbar tabs", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					item={{
						id: "tabs",
						type: "tabs",
						label: "Tabs",
						props: {
							stickyTabs: true,
							tabs: [
								{
									name: "One",
									widgets: [
										{type: "text", props: {text: "A"}},
									],
								},
							],
						},
					}}
				/>
			</MantineProvider>,
		);

		expect(screen.getByTestId("toolbar-tabs").textContent).toBe(
			"tabs: 1 sticky:true",
		);
	});

	it("renders a visible parameter and skips a hidden one", () => {
		const {useParameters} = jest.requireMock(
			"@AppBuilderLib/entities/parameter/model/useParameters",
		);
		useParameters.mockReturnValue([
			{
				definition: {type: "String", hidden: false},
				actions: {isValid: () => true},
			},
		]);

		const {rerender} = render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					componentContext={{
						parameters: {
							String: {
								component: MockParameter,
								extraBottomPadding: false,
							},
						},
					}}
					parameterProps={[
						{
							namespace: "namespace",
							parameterId: "Length",
							acceptRejectMode: false,
						},
					]}
					item={{
						id: "length",
						type: "parameter",
						label: "Length",
						props: {name: "Length"},
					}}
				/>
			</MantineProvider>,
		);

		expect(screen.getByTestId("toolbar-parameter").textContent).toBe(
			"Length:true",
		);

		useParameters.mockReturnValue([
			{
				definition: {type: "String", hidden: true},
				actions: {isValid: () => true},
			},
		]);
		rerender(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					componentContext={{
						parameters: {
							String: {
								component: MockParameter,
								extraBottomPadding: false,
							},
						},
					}}
					parameterProps={[
						{
							namespace: "namespace",
							parameterId: "Length",
						},
					]}
					item={{
						id: "length",
						type: "parameter",
						label: "Length",
						props: {name: "Length"},
					}}
				/>
			</MantineProvider>,
		);

		expect(screen.queryByTestId("toolbar-parameter")).toBeNull();
	});

	it("renders a visible output and skips a hidden one", () => {
		const {useOutputs} = jest.requireMock(
			"@AppBuilderLib/entities/output/model/useOutputs",
		);
		useOutputs.mockReturnValue([
			{definition: {hidden: false}, actions: {isValid: () => true}},
		]);

		const {rerender} = render(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					outputProps={[{namespace: "namespace", outputId: "Mesh"}]}
					item={{
						id: "mesh",
						type: "output",
						label: "Mesh",
						props: {name: "Mesh"},
					}}
				/>
			</MantineProvider>,
		);

		expect(screen.getByTestId("toolbar-output").textContent).toBe(
			"namespace:Mesh",
		);

		useOutputs.mockReturnValue([
			{definition: {hidden: true}, actions: {isValid: () => true}},
		]);
		rerender(
			<MantineProvider>
				<AppBuilderToolbarPopoverContent
					{...baseProps}
					outputProps={[{namespace: "namespace", outputId: "Mesh"}]}
					item={{
						id: "mesh",
						type: "output",
						label: "Mesh",
						props: {name: "Mesh"},
					}}
				/>
			</MantineProvider>,
		);

		expect(screen.queryByTestId("toolbar-output")).toBeNull();
	});
});
