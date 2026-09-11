/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {MantineProvider} from "@mantine/core";
import {fireEvent, render, screen} from "@testing-library/react";
import type React from "react";
import AppBuilderToolbarPopoverButton from "../AppBuilderToolbarPopoverButton";

jest.mock("../AppBuilderToolbarPopoverContent", () => ({
	__esModule: true,
	default: ({
		onActionActivate,
		parameterProps,
		outputProps,
	}: {
		onActionActivate?: () => void;
		parameterProps?: Array<{
			parameterId: string;
			namespace: string;
			delegates?: Array<{parameterId: string; namespace: string}>;
		}>;
		outputProps?: Array<{outputId: string; namespace: string}>;
	}) => (
		<div>
			{parameterProps?.map((parameter) => (
				<div
					key={parameter.parameterId}
					data-testid="popover-parameter"
				>
					{parameter.namespace}:{parameter.parameterId}:
					{(parameter.delegates ?? [])
						.map(
							(delegate) =>
								`${delegate.namespace}:${delegate.parameterId}`,
						)
						.join(",")}
				</div>
			))}
			{outputProps?.map((output) => (
				<div key={output.outputId} data-testid="popover-output">
					{output.namespace}:{output.outputId}
				</div>
			))}
			<button onClick={onActionActivate}>Activate menu action</button>
		</div>
	),
}));

jest.mock(
	"@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton",
	() => {
		const actual = jest.requireActual(
			"@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton",
		) as typeof import("@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarIconButton");

		return {
			...actual,
			__esModule: true,
			default: ({
				label,
				disabled,
				iconType,
				onClick,
			}: {
				label: string;
				disabled?: boolean;
				iconType?: string;
				onClick?: React.MouseEventHandler<HTMLButtonElement>;
			}) => (
				<button
					aria-label={label}
					data-icon-type={iconType}
					disabled={disabled}
					onClick={onClick}
				/>
			),
		};
	},
);

const buttonRenderContext = {
	namespace: "namespace",
	executing: false,
	fullscreenId: "fullscreen-root",
};

const actionMenuItem = {
	id: "actions",
	type: "menu" as const,
	label: "Actions",
	props: {
		sections: [
			{
				id: "section",
				items: [
					{
						id: "action",
						type: "action" as const,
						label: "Action",
						props: {
							definition: {
								type: "importModelState" as const,
								props: {},
							},
						},
					},
				],
			},
		],
	},
};

describe("AppBuilderToolbarPopoverButton", () => {
	it("closes action menus while keeping their content mounted", () => {
		const onPopoverOpenChange = jest.fn();
		const {rerender} = render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={actionMenuItem}
					buttonRenderContext={buttonRenderContext}
					popoverId="actions"
					openedPopoverId="actions"
					onPopoverOpenChange={onPopoverOpenChange}
				/>
			</MantineProvider>,
		);

		fireEvent.click(
			screen.getByRole("button", {name: "Activate menu action"}),
		);
		expect(onPopoverOpenChange).toHaveBeenCalledWith("actions", false);

		rerender(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={actionMenuItem}
					buttonRenderContext={buttonRenderContext}
					popoverId="actions"
					onPopoverOpenChange={onPopoverOpenChange}
				/>
			</MantineProvider>,
		);

		expect(
			screen.getByRole("button", {name: "Activate menu action"}),
		).toBeTruthy();
	});

	it("starts closed when open state is uncontrolled", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "drawing",
						type: "parameter",
						label: "Drawing",
						props: {name: "Drawing"},
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(
			screen.queryByRole("button", {name: "Activate menu action"}),
		).toBeNull();
	});

	it("does not close a popover while an interaction request is active", () => {
		const onPopoverOpenChange = jest.fn();

		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "drawing",
						type: "parameter",
						label: "Drawing",
						props: {name: "Drawing"},
					}}
					buttonRenderContext={buttonRenderContext}
					popoverId="drawing"
					openedPopoverId="drawing"
					onPopoverOpenChange={onPopoverOpenChange}
					popoverDismissalBlocked
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Drawing"}));

		expect(onPopoverOpenChange).not.toHaveBeenCalled();
	});

	it("toggles an unblocked popover closed from the trigger", () => {
		const onPopoverOpenChange = jest.fn();

		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "drawing",
						type: "parameter",
						label: "Drawing",
						props: {name: "Drawing"},
					}}
					buttonRenderContext={buttonRenderContext}
					popoverId="drawing"
					openedPopoverId="drawing"
					onPopoverOpenChange={onPopoverOpenChange}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Drawing"}));

		expect(onPopoverOpenChange).toHaveBeenCalledWith("drawing", false);
	});

	it("opens an uncontrolled popover from the trigger", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "drawing",
						type: "parameter",
						label: "Drawing",
						props: {name: "Drawing"},
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Drawing"}));

		expect(
			screen
				.getByRole("button", {name: "Drawing"})
				.closest("[aria-expanded]")
				?.getAttribute("aria-expanded"),
		).toBe("true");
	});

	it("does not throw when popoverId is set without a change handler", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={actionMenuItem}
					buttonRenderContext={buttonRenderContext}
					popoverId="actions"
				/>
			</MantineProvider>,
		);

		expect(() =>
			fireEvent.click(screen.getByRole("button", {name: "Actions"})),
		).not.toThrow();
	});

	it("stays closed when openedPopoverId does not match", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={actionMenuItem}
					buttonRenderContext={buttonRenderContext}
					popoverId="actions"
					openedPopoverId="other"
					onPopoverOpenChange={jest.fn()}
				/>
			</MantineProvider>,
		);

		expect(
			screen.queryByRole("button", {name: "Activate menu action"}),
		).toBeNull();
	});

	it("passes parameter popover props including delegate namespaces", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "length",
						type: "parameter",
						label: "Length",
						props: {
							name: "Length",
							sessionId: "session-2",
							delegates: [
								{name: "Width", sessionId: "session-3"},
								{name: "Height"},
							],
						},
					}}
					buttonRenderContext={buttonRenderContext}
					popoverId="length"
					openedPopoverId="length"
					onPopoverOpenChange={jest.fn()}
				/>
			</MantineProvider>,
		);

		expect(screen.getByTestId("popover-parameter").textContent).toBe(
			"session-2:Length:session-3:Width,namespace:Height",
		);
	});

	it("passes output popover props with the session namespace", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "mesh",
						type: "output",
						label: "Mesh",
						props: {name: "Mesh", sessionId: "session-2"},
					}}
					buttonRenderContext={buttonRenderContext}
					popoverId="mesh"
					openedPopoverId="mesh"
					onPopoverOpenChange={jest.fn()}
				/>
			</MantineProvider>,
		);

		expect(screen.getByTestId("popover-output").textContent).toBe(
			"session-2:Mesh",
		);
	});

	it("falls back to the first letter of the label when no icon is set", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "drawing",
						type: "parameter",
						label: "drawing",
						props: {name: "Drawing"},
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		expect(
			screen
				.getByRole("button", {name: "drawing"})
				.getAttribute("data-icon-type"),
		).toBe("D");
	});

	it("uses the toolbar default icon when the item has none", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "drawing",
						type: "parameter",
						label: "Drawing",
						props: {name: "Drawing"},
					}}
					buttonRenderContext={buttonRenderContext}
					defaultIcon="tabler:apps"
				/>
			</MantineProvider>,
		);

		expect(
			screen
				.getByRole("button", {name: "Drawing"})
				.getAttribute("data-icon-type"),
		).toBe("tabler:apps");
	});

	it("renders empty widget panels as a non-popover icon button", () => {
		render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "empty-widgets",
						type: "widgets",
						label: "Empty",
						icon: "tabler:box",
						props: {widgets: []},
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Empty"}));

		expect(
			screen.queryByRole("button", {name: "Activate menu action"}),
		).toBeNull();
		expect(
			screen
				.getByRole("button", {name: "Empty"})
				.getAttribute("data-icon-type"),
		).toBe("tabler:box");
	});

	it("renders empty menus and tabs as non-popover icon buttons", () => {
		const {rerender} = render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "empty-menu",
						type: "menu",
						label: "Menu",
						props: {sections: [{id: "section", items: []}]},
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Menu"}));
		expect(
			screen.queryByRole("button", {name: "Activate menu action"}),
		).toBeNull();

		rerender(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={{
						id: "empty-tabs",
						type: "tabs",
						label: "Tabs",
						props: {tabs: []},
					}}
					buttonRenderContext={buttonRenderContext}
				/>
			</MantineProvider>,
		);

		fireEvent.click(screen.getByRole("button", {name: "Tabs"}));
		expect(
			screen.queryByRole("button", {name: "Activate menu action"}),
		).toBeNull();
	});

	it("keeps mixed action menus mounted and unmounts command-only menus", () => {
		const mixedMenu = {
			id: "mixed",
			type: "menu" as const,
			label: "Mixed",
			props: {
				sections: [
					{
						id: "actions",
						items: [
							{
								id: "action",
								type: "action" as const,
								label: "Action",
								props: {
									definition: {
										type: "importModelState" as const,
										props: {},
									},
								},
							},
							{
								id: "cmd",
								type: "command" as const,
								label: "Run",
								props: {execute: jest.fn()},
							},
						],
					},
					{
						id: "commands",
						items: [
							{
								id: "other",
								type: "command" as const,
								label: "Other",
								props: {execute: jest.fn()},
							},
						],
					},
				],
			},
		};

		const {rerender} = render(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={mixedMenu}
					buttonRenderContext={buttonRenderContext}
					popoverId="mixed"
					openedPopoverId="mixed"
					onPopoverOpenChange={jest.fn()}
				/>
			</MantineProvider>,
		);

		expect(
			screen.getByRole("button", {name: "Activate menu action"}),
		).toBeTruthy();

		rerender(
			<MantineProvider>
				<AppBuilderToolbarPopoverButton
					item={mixedMenu}
					buttonRenderContext={buttonRenderContext}
					popoverId="mixed"
					onPopoverOpenChange={jest.fn()}
				/>
			</MantineProvider>,
		);

		expect(
			screen.getByRole("button", {name: "Activate menu action"}),
		).toBeTruthy();
	});
});
