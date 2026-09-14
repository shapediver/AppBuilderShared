/**
 * @jest-environment jsdom
 */
const mockWaitForAppBuilderSessionIdle = jest.fn(async () => {});
const mockRunSetParameterValues = jest.fn(async () => {});
const mockRunSetContainerVisibility = jest.fn(() => {});

jest.mock("../waitForAppBuilderSessionIdle", () => ({
	waitForAppBuilderSessionIdle: (...args: unknown[]) =>
		mockWaitForAppBuilderSessionIdle(...args),
}));

jest.mock("../runAppBuilderActionSetParameterValues", () => ({
	runAppBuilderActionSetParameterValues: (...args: unknown[]) =>
		mockRunSetParameterValues(...args),
}));

jest.mock("../runAppBuilderActionSetContainerVisibility", () => ({
	runAppBuilderActionSetContainerVisibility: (...args: unknown[]) =>
		mockRunSetContainerVisibility(...args),
}));

import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	AppBuilderActionType,
	AppBuilderContainerNameType,
} from "../../config/appbuilder";
import {runAppBuilderActions} from "../runAppBuilderAction";

const setParameterValuesAction = {
	type: AppBuilderActionType.SetParameterValues,
	props: {parameterValues: []},
} as const;

const setContainerVisibilityAction = {
	type: AppBuilderActionType.SetContainerVisibility,
	props: {
		container: {name: AppBuilderContainerNameType.Left},
		mode: "open" as const,
	},
};

const context = {namespace: "session"};

describe("runAppBuilderActions", () => {
	beforeEach(() => {
		mockWaitForAppBuilderSessionIdle.mockClear();
		mockRunSetParameterValues.mockClear();
		mockRunSetContainerVisibility.mockClear();
		mockWaitForAppBuilderSessionIdle.mockResolvedValue(undefined);
		mockRunSetParameterValues.mockResolvedValue(undefined);
		mockRunSetContainerVisibility.mockImplementation(() => {});
	});

	it("runs actions one after another in sequential mode and waits for session idle after each", async () => {
		const order: string[] = [];
		mockRunSetParameterValues.mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			order.push("params");
		});
		mockRunSetContainerVisibility.mockImplementation(() => {
			order.push("visibility");
		});
		mockWaitForAppBuilderSessionIdle.mockImplementation(async () => {
			order.push("idle");
		});

		await runAppBuilderActions(
			[setParameterValuesAction, setContainerVisibilityAction],
			"sequential",
			context,
		);

		expect(order).toEqual(["params", "idle", "visibility", "idle"]);
	});

	it("runs actions in parallel, then waits for session idle once", async () => {
		const order: string[] = [];
		mockRunSetParameterValues.mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
			order.push("params");
		});
		mockRunSetContainerVisibility.mockImplementation(() => {
			order.push("visibility");
		});
		mockWaitForAppBuilderSessionIdle.mockImplementation(async () => {
			order.push("idle");
		});

		await runAppBuilderActions(
			[setParameterValuesAction, setContainerVisibilityAction],
			"parallel",
			context,
		);

		expect(order[order.length - 1]).toBe("idle");
		expect(order).toEqual(expect.arrayContaining(["params", "visibility"]));
		expect(mockWaitForAppBuilderSessionIdle).toHaveBeenCalledTimes(1);
	});

	it("recurses into nested executeActions", async () => {
		await runAppBuilderActions(
			[
				{
					type: AppBuilderActionType.ExecuteActions,
					props: {
						mode: "sequential",
						actions: [
							setParameterValuesAction,
							setContainerVisibilityAction,
						],
					},
				},
			],
			"sequential",
			context,
		);

		expect(mockRunSetParameterValues).toHaveBeenCalledTimes(1);
		expect(mockRunSetContainerVisibility).toHaveBeenCalledTimes(1);
		expect(mockWaitForAppBuilderSessionIdle).toHaveBeenCalledTimes(3);
	});

	it("lets every parallel action run even when one rejects", async () => {
		mockRunSetParameterValues.mockRejectedValue(new Error("boom"));

		await expect(
			runAppBuilderActions(
				[setParameterValuesAction, setContainerVisibilityAction],
				"parallel",
				context,
			),
		).rejects.toThrow("boom");

		expect(mockRunSetContainerVisibility).toHaveBeenCalledTimes(1);
	});

	it("stops sequential execution when an action rejects", async () => {
		mockRunSetParameterValues.mockRejectedValue(new Error("boom"));

		await expect(
			runAppBuilderActions(
				[setParameterValuesAction, setContainerVisibilityAction],
				"sequential",
				context,
			),
		).rejects.toThrow("boom");

		expect(mockRunSetContainerVisibility).not.toHaveBeenCalled();
	});

	it("undo restores parameter history instead of navigating the browser", async () => {
		const restore = jest.fn(async () => {});
		const back = jest.spyOn(window.history, "back");
		const original = useShapeDiverStoreParameters.getState();
		useShapeDiverStoreParameters.setState({
			history: [
				{state: {}, time: 1, unsavedChanges: false},
				{state: {}, time: 2, unsavedChanges: false},
			],
			historyIndex: 1,
			restoreHistoryStateFromIndex: restore,
		});

		try {
			await runAppBuilderActions(
				[{type: AppBuilderActionType.Undo, props: {}}],
				"sequential",
				context,
			);
			expect(restore).toHaveBeenCalledWith(0);
			expect(back).not.toHaveBeenCalled();
		} finally {
			useShapeDiverStoreParameters.setState({
				history: original.history,
				historyIndex: original.historyIndex,
				restoreHistoryStateFromIndex:
					original.restoreHistoryStateFromIndex,
			});
			back.mockRestore();
		}
	});

	it("undo is a no-op when there is no previous parameter history", async () => {
		const restore = jest.fn(async () => {});
		const original = useShapeDiverStoreParameters.getState();
		useShapeDiverStoreParameters.setState({
			history: [{state: {}, time: 1, unsavedChanges: false}],
			historyIndex: 0,
			restoreHistoryStateFromIndex: restore,
		});

		try {
			await runAppBuilderActions(
				[{type: AppBuilderActionType.Undo, props: {}}],
				"sequential",
				context,
			);
			expect(restore).not.toHaveBeenCalled();
		} finally {
			useShapeDiverStoreParameters.setState({
				history: original.history,
				historyIndex: original.historyIndex,
				restoreHistoryStateFromIndex:
					original.restoreHistoryStateFromIndex,
			});
		}
	});

	it("runs a host-registered executor for viewer-specific actions", async () => {
		const run = jest.fn(async () => {});
		await runAppBuilderActions(
			[
				{
					type: AppBuilderActionType.Camera,
					props: {type: "zoomTo", props: {}},
				},
			],
			"sequential",
			{
				namespace: "session",
				hostActions: {
					camera: {
						isAction: (definition) => definition.type === "camera",
						run,
					},
				},
			},
		);
		expect(run).toHaveBeenCalledTimes(1);
	});

	it("skips a host-registered action that has no run", async () => {
		const restore = jest.fn(async () => {});
		const original = useShapeDiverStoreParameters.getState();
		useShapeDiverStoreParameters.setState({
			history: [
				{state: {}, time: 1, unsavedChanges: false},
				{state: {}, time: 2, unsavedChanges: false},
			],
			historyIndex: 1,
			restoreHistoryStateFromIndex: restore,
		});

		try {
			await runAppBuilderActions(
				[
					{
						type: AppBuilderActionType.Camera,
						props: {type: "zoomTo", props: {}},
					},
					{type: AppBuilderActionType.Undo, props: {}},
				],
				"sequential",
				{
					namespace: "session",
					hostActions: {
						camera: {
							isAction: (definition) =>
								definition.type === "camera",
						},
						undo: {
							isAction: (definition) =>
								definition.type === "undo",
						},
					},
				},
			);
			expect(restore).not.toHaveBeenCalled();
		} finally {
			useShapeDiverStoreParameters.setState({
				history: original.history,
				historyIndex: original.historyIndex,
				restoreHistoryStateFromIndex:
					original.restoreHistoryStateFromIndex,
			});
		}
	});

	it("warns when a viewer-only action is omitted by the host", async () => {
		const warn = jest.spyOn(Logger, "warn").mockImplementation(() => {});
		try {
			await runAppBuilderActions(
				[
					{
						type: AppBuilderActionType.Camera,
						props: {type: "zoomTo", props: {}},
					},
				],
				"sequential",
				{namespace: "session"},
			);
			expect(warn).toHaveBeenCalled();
		} finally {
			warn.mockRestore();
		}
	});
});
