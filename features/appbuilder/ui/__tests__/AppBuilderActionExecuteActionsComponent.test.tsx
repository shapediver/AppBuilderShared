/**
 * @jest-environment jsdom
 */
const mockRunAppBuilderActions = jest.fn(async () => {});

jest.mock("../../model/runAppBuilderAction", () => ({
	runAppBuilderActions: (...args: unknown[]) =>
		mockRunAppBuilderActions(...args),
}));

jest.mock("../AppBuilderActionBase", () => {
	const React = jest.requireActual("react") as typeof import("react");
	return {
		__esModule: true,
		default: ({
			onClick,
			disabled,
			label,
			buttonRef,
		}: {
			onClick?: () => void;
			disabled?: boolean;
			label?: string;
			buttonRef?: React.Ref<HTMLButtonElement>;
		}) =>
			React.createElement(
				"button",
				{onClick, disabled, type: "button", ref: buttonRef},
				label ?? "Run actions",
			),
	};
});

import {useViewportAnchorTriggerRegistry} from "@AppBuilderLib/entities/viewport-anchor/model/useViewportAnchorTriggerRegistry";
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	clearActionHost,
	noteActionHost,
} from "@AppBuilderLib/features/appbuilder/model/appBuilderActionHost";
import {ViewportContext} from "@AppBuilderLib/shared/lib/ViewportContext";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {createElement} from "react";
import AppBuilderActionExecuteActionsComponent from "../AppBuilderActionExecuteActionsComponent";

const actions = [{type: "undo" as const, props: {}}];

describe("AppBuilderActionExecuteActionsComponent", () => {
	beforeEach(() => {
		mockRunAppBuilderActions.mockClear();
		mockRunAppBuilderActions.mockResolvedValue(undefined);
		clearActionHost();
		useViewportAnchorTriggerRegistry.setState({triggers: {}});
	});

	it("runs nested definitions through the headless dispatcher", async () => {
		render(
			createElement(AppBuilderActionExecuteActionsComponent, {
				actions,
				mode: "sequential",
				namespace: "session",
				viewportId: "viewport-1",
				fullscreenId: "fullscreen-area",
			}),
		);

		await act(async () => {
			fireEvent.click(screen.getByRole("button"));
		});

		expect(mockRunAppBuilderActions).toHaveBeenCalledWith(
			actions,
			"sequential",
			{
				namespace: "session",
				viewportId: "viewport-1",
				fullscreenId: "fullscreen-area",
				hostActions: undefined,
			},
		);
	});

	it("uses ViewportContext when viewportId is omitted", async () => {
		render(
			createElement(
				ViewportContext.Provider,
				{value: {viewportId: "ctx-vp"}},
				createElement(AppBuilderActionExecuteActionsComponent, {
					actions,
					namespace: "session",
				}),
			),
		);

		await act(async () => {
			fireEvent.click(screen.getByRole("button"));
		});

		expect(mockRunAppBuilderActions).toHaveBeenCalledWith(
			actions,
			"parallel",
			{
				namespace: "session",
				viewportId: "ctx-vp",
				fullscreenId: undefined,
				hostActions: undefined,
			},
		);
	});

	it("passes the toolbar click through to the sequence", async () => {
		render(
			createElement(AppBuilderActionExecuteActionsComponent, {
				actions,
				namespace: "session",
			}),
		);
		const button = screen.getByRole("button");
		noteActionHost({
			element: button,
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a", "panel-b"],
		});

		await act(async () => {
			fireEvent.click(button);
		});

		const context = mockRunAppBuilderActions.mock.calls[0]?.[2] as {
			actionHost?: {
				element: HTMLElement;
				exclusiveContainers: boolean;
				siblingAnchorIds: readonly string[];
				actions: typeof actions;
			};
		};
		expect(context.actionHost?.element).toBe(button);
		expect(context.actionHost?.exclusiveContainers).toBe(true);
		expect(context.actionHost?.siblingAnchorIds).toEqual([
			"panel-a",
			"panel-b",
		]);
		expect(context.actionHost?.actions).toBe(actions);
	});

	it("registers a nested anchor on its button and keeps it across a new action list", () => {
		const nested = [
			{
				type: "executeActions" as const,
				props: {
					actions: [
						{
							type: "setContainerVisibility" as const,
							props: {
								mode: "open" as const,
								container: {
									name: AppBuilderContainerNameType.Anchor2d,
									props: {id: "panel-a"},
								},
							},
						},
					],
				},
			},
		];
		const view = render(
			createElement(AppBuilderActionExecuteActionsComponent, {
				actions: nested,
				namespace: "session",
			}),
		);
		const button = screen.getByRole("button");

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(button);

		view.rerender(
			createElement(AppBuilderActionExecuteActionsComponent, {
				actions: nested.map((action) => ({...action})),
				namespace: "session",
			}),
		);

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(button);

		view.unmount();

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBe(null);
	});

	it("does not run when disabled", async () => {
		render(
			createElement(AppBuilderActionExecuteActionsComponent, {
				actions,
				namespace: "session",
				disabled: true,
			}),
		);

		await act(async () => {
			fireEvent.click(screen.getByRole("button"));
		});

		expect(mockRunAppBuilderActions).not.toHaveBeenCalled();
	});
});
