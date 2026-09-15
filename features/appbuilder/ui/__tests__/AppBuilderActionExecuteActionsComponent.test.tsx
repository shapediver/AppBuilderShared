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
		}: {
			onClick?: () => void;
			disabled?: boolean;
			label?: string;
		}) =>
			React.createElement(
				"button",
				{onClick, disabled, type: "button"},
				label ?? "Run actions",
			),
	};
});

import {ViewportContext} from "@AppBuilderLib/shared/lib/ViewportContext";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {createElement} from "react";
import AppBuilderActionExecuteActionsComponent from "../AppBuilderActionExecuteActionsComponent";

const actions = [{type: "undo" as const, props: {}}];

describe("AppBuilderActionExecuteActionsComponent", () => {
	beforeEach(() => {
		mockRunAppBuilderActions.mockClear();
		mockRunAppBuilderActions.mockResolvedValue(undefined);
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
