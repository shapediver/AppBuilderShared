/**
 * @jest-environment jsdom
 */
const mockWaitForAppBuilderSessionIdle = jest.fn(async () => {});
const mockRunSetParameterValues = jest.fn(async () => {});
const mockRunSetContainerVisibility = jest.fn(() => {});
const mockRunCamera = jest.fn(async () => {});
const mockRunAr = jest.fn(async () => {});
const mockRunFullscreen = jest.fn(async () => {});

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

jest.mock("../runAppBuilderActionCamera", () => ({
	runAppBuilderActionCamera: (...args: unknown[]) => mockRunCamera(...args),
}));

jest.mock("../runAppBuilderActionAr", () => ({
	runAppBuilderActionAr: (...args: unknown[]) => mockRunAr(...args),
}));

jest.mock("../runAppBuilderActionFullscreen", () => ({
	runAppBuilderActionFullscreen: (...args: unknown[]) =>
		mockRunFullscreen(...args),
}));

jest.mock("../../ui/AppBuilderActionCameraComponent", () => ({
	__esModule: true,
	default: function AppBuilderActionCameraComponent() {
		return null;
	},
}));

jest.mock("../../ui/AppBuilderActionArComponent", () => ({
	__esModule: true,
	default: function AppBuilderActionArComponent() {
		return null;
	},
}));

jest.mock("../../ui/AppBuilderActionFullscreenComponent", () => ({
	__esModule: true,
	default: function AppBuilderActionFullscreenComponent() {
		return null;
	},
}));

import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useImportModelStateDialogStore} from "@AppBuilderLib/features/model-state/model/useImportModelStateDialogStore";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	AppBuilderActionType,
	AppBuilderContainerNameType,
} from "../../config/appbuilder";
import AppBuilderActionArComponent from "../../ui/AppBuilderActionArComponent";
import AppBuilderActionCameraComponent from "../../ui/AppBuilderActionCameraComponent";
import AppBuilderActionFullscreenComponent from "../../ui/AppBuilderActionFullscreenComponent";
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
		mockRunCamera.mockClear();
		mockRunAr.mockClear();
		mockRunFullscreen.mockClear();
		mockWaitForAppBuilderSessionIdle.mockResolvedValue(undefined);
		mockRunSetParameterValues.mockResolvedValue(undefined);
		mockRunSetContainerVisibility.mockImplementation(() => {});
		useImportModelStateDialogStore.setState({
			current: null,
			queue: [],
		});
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
		expect(mockRunCamera).not.toHaveBeenCalled();
	});

	it("uses the ShapeDiver executor when the host renders camera, AR, or fullscreen without run", async () => {
		await runAppBuilderActions(
			[
				{
					type: AppBuilderActionType.Camera,
					props: {type: "zoomTo", props: {}},
				},
				{type: AppBuilderActionType.Ar, props: {}},
				{type: AppBuilderActionType.Fullscreen, props: {}},
			],
			"sequential",
			{
				namespace: "session",
				hostActions: {
					camera: {
						isAction: (definition) => definition.type === "camera",
						component: AppBuilderActionCameraComponent,
					},
					ar: {
						isAction: (definition) => definition.type === "ar",
						component: AppBuilderActionArComponent,
					},
					fullscreen: {
						isAction: (definition) =>
							definition.type === "fullscreen",
						component: AppBuilderActionFullscreenComponent,
					},
				},
			},
		);
		expect(mockRunCamera).toHaveBeenCalledTimes(1);
		expect(mockRunAr).toHaveBeenCalledTimes(1);
		expect(mockRunFullscreen).toHaveBeenCalledTimes(1);
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

	it("opens the importModelState dialog and waits for the user to close it", async () => {
		const done = runAppBuilderActions(
			[{type: AppBuilderActionType.ImportModelState, props: {}}],
			"sequential",
			context,
		);
		expect(
			useImportModelStateDialogStore.getState().current?.namespace,
		).toBe("session");
		useImportModelStateDialogStore.getState().close();
		await done;
		expect(useImportModelStateDialogStore.getState().current).toBeNull();
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
