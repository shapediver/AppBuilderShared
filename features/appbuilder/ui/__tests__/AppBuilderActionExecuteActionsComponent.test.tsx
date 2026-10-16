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
import {
	bindActionClickTrigger,
	clearActionClickExclusivity,
	noteActionClickExclusivity,
	useActionClickSourceStore,
} from "@AppBuilderLib/features/appbuilder/model/useActionClickSourceStore";
import {ViewportContext} from "@AppBuilderLib/shared/lib/ViewportContext";
import {act, fireEvent, render, screen} from "@testing-library/react";
import {createElement} from "react";
import AppBuilderActionExecuteActionsComponent from "../AppBuilderActionExecuteActionsComponent";

const actions = [{type: "undo" as const, props: {}}];

describe("AppBuilderActionExecuteActionsComponent", () => {
	beforeEach(() => {
		mockRunAppBuilderActions.mockClear();
		mockRunAppBuilderActions.mockResolvedValue(undefined);
		useActionClickSourceStore.setState({
			source: null,
			clicks: {},
			token: 0,
		});
		useViewportAnchorTriggerRegistry.setState({triggers: {}});
		clearActionClickExclusivity();
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

	it("publishes the clicked button until the sequence finishes", async () => {
		let release: () => void = () => {};
		mockRunAppBuilderActions.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					release = resolve;
				}),
		);
		render(
			createElement(AppBuilderActionExecuteActionsComponent, {
				actions,
				namespace: "session",
				viewportId: "viewport-1",
			}),
		);
		noteActionClickExclusivity({
			exclusiveContainers: true,
			siblingAnchorIds: ["panel-a", "panel-b"],
		});

		await act(async () => {
			fireEvent.click(screen.getByRole("button"));
		});

		const source = useActionClickSourceStore.getState().source;
		expect(source?.element).toBe(screen.getByRole("button"));
		expect(source?.exclusiveContainers).toBe(true);
		expect(source?.siblingAnchorIds).toEqual(["panel-a", "panel-b"]);
		expect(source?.actions).toBe(actions);
		expect(mockRunAppBuilderActions).toHaveBeenCalledWith(
			actions,
			"parallel",
			expect.objectContaining({
				viewportId: "viewport-1",
				clickToken: expect.any(Number),
			}),
		);

		await act(async () => {
			release();
		});

		expect(useActionClickSourceStore.getState().source).toBeNull();
	});

	it("clears anchor triggers bound to its button on unmount", () => {
		const view = render(
			createElement(AppBuilderActionExecuteActionsComponent, {
				actions,
				namespace: "session",
			}),
		);
		const button = screen.getByRole("button");
		bindActionClickTrigger(button, "panel-a");

		view.unmount();

		expect(
			useViewportAnchorTriggerRegistry.getState().triggers["panel-a"],
		).toBeNull();
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
