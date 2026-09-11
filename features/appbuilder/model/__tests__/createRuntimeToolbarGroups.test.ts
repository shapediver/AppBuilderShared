/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {
	createToolbarCheckboxItem,
	createToolbarCommand,
} from "../createToolbarItems";
import {resolveRuntimeToolbarGroups} from "../resolveRuntimeToolbarGroups";
import type {RuntimeToolbarContribution} from "../runtimeToolbarContributionRegistry";

const contribution = (
	id: string,
	sectionId: string,
	overrides: Partial<RuntimeToolbarContribution> = {},
): RuntimeToolbarContribution => ({
	id,
	namespace: "namespace",
	viewportId: "viewport",
	sectionId,
	menu: {id: `runtime-interaction-${sectionId}-menu`, label: sectionId},
	items: [
		createToolbarCheckboxItem({
			id: `${id}-toggle`,
			label: id,
			checked: false,
			setChecked: jest.fn(),
		}),
	],
	...overrides,
});

describe("resolveRuntimeToolbarGroups", () => {
	it("combines selection parameters into one menu and aggregate commands", () => {
		const firstConfirm = jest.fn();
		const secondConfirm = jest.fn();
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				menuVisibility: "multipleToggleable",
				commands: [
					createToolbarCommand({
						id: "first-confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute: firstConfirm,
					}),
				],
			}),
			contribution("second", "selection", {
				menuVisibility: "multipleToggleable",
				commands: [
					createToolbarCommand({
						id: "second-confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute: secondConfirm,
					}),
				],
			}),
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0]).toHaveLength(2);
		const menu = groups[0][0];
		expect(menu.type).toBe("menu");
		if (menu.type !== "menu") throw new Error("Expected menu");
		expect(menu.props.sections[0].items).toHaveLength(2);
		const command = groups[0][1];
		expect(command.type).toBe("command");
		if (command.type !== "command") throw new Error("Expected command");
		command.props.execute();
		expect(firstConfirm).toHaveBeenCalledTimes(1);
		expect(secondConfirm).toHaveBeenCalledTimes(1);
	});

	it("hides the selection menu when there is nothing toggleable", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				menuVisibility: "multipleToggleable",
				items: [
					createToolbarCheckboxItem({
						id: "first-toggle",
						label: "First",
						checked: true,
						readOnly: true,
						setChecked: jest.fn(),
					}),
				],
			}),
			contribution("second", "selection", {
				menuVisibility: "multipleToggleable",
				items: [
					createToolbarCheckboxItem({
						id: "second-toggle",
						label: "Second",
						checked: true,
						readOnly: true,
						setChecked: jest.fn(),
					}),
				],
			}),
		]);

		expect(groups).toEqual([]);
	});

	it("promotes one selection checkbox and its clear action into toolbar buttons", () => {
		const setChecked = jest.fn();
		const clear = jest.fn();
		const groups = resolveRuntimeToolbarGroups([
			contribution("only", "selection", {
				menu: {
					id: "runtime-interaction-selection-menu",
					label: "Selection",
					icon: "tabler:hand-finger",
				},
				menuVisibility: "multipleToggleable",
				items: [
					createToolbarCheckboxItem({
						id: "only-toggle",
						label: "Only",
						checked: true,
						setChecked,
						trailingAction: {
							label: "Clear Only",
							icon: "tabler:circle-off",
							execute: clear,
						},
					}),
				],
			}),
		]);

		expect(groups[0].map((item) => item.type)).toEqual([
			"checkbox",
			"command",
		]);
		const toggle = groups[0][0];
		if (toggle.type !== "checkbox") throw new Error("Expected toggle");
		expect(toggle.icon).toBe("tabler:hand-finger");
		const clearCommand = groups[0][1];
		if (clearCommand.type !== "command")
			throw new Error("Expected clear command");
		expect(clearCommand.label).toBe("Clear Only");
		clearCommand.props.execute();
		expect(clear).toHaveBeenCalledTimes(1);
	});

	it("does not promote a read-only selection checkbox", () => {
		const clear = jest.fn();
		const groups = resolveRuntimeToolbarGroups([
			contribution("only", "selection", {
				menuVisibility: "multipleToggleable",
				items: [
					createToolbarCheckboxItem({
						id: "only-toggle",
						label: "Only",
						checked: true,
						readOnly: true,
						setChecked: jest.fn(),
						trailingAction: {
							label: "Clear Only",
							icon: "tabler:circle-off",
							execute: clear,
						},
					}),
				],
			}),
		]);

		expect(groups[0].map((item) => item.type)).toEqual(["command"]);
		expect(groups[0][0].label).toBe("Clear Only");
	});

	it("keeps the clear actions of read-only selection checkboxes when the menu is hidden", () => {
		const clearFirst = jest.fn();
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				menuVisibility: "multipleToggleable",
				items: [
					createToolbarCheckboxItem({
						id: "first-toggle",
						label: "First",
						checked: true,
						readOnly: true,
						setChecked: jest.fn(),
						trailingAction: {
							label: "Clear First",
							icon: "tabler:circle-off",
							execute: clearFirst,
						},
					}),
				],
			}),
			contribution("second", "selection", {
				menuVisibility: "multipleToggleable",
				items: [
					createToolbarCheckboxItem({
						id: "second-toggle",
						label: "Second",
						checked: true,
						readOnly: true,
						setChecked: jest.fn(),
					}),
				],
			}),
		]);

		// two always-active selections: no menu, no checkboxes, but the
		// clear action of the first selection is kept as a command
		expect(groups[0].map((item) => item.type)).toEqual(["command"]);
		expect(groups[0][0].label).toBe("Clear First");
		if (groups[0][0].type !== "command")
			throw new Error("Expected command");
		groups[0][0].props.execute();
		expect(clearFirst).toHaveBeenCalledTimes(1);
	});

	it("keeps aggregate command order independent of contribution shape", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				commands: [
					createToolbarCommand({
						id: "first-clear",
						aggregationId: "selection-clear",
						order: 30,
						label: "Clear",
						execute: jest.fn(),
					}),
				],
			}),
			contribution("second", "selection", {
				commands: [
					createToolbarCommand({
						id: "second-confirm",
						aggregationId: "selection-confirm",
						order: 10,
						label: "Confirm",
						execute: jest.fn(),
					}),
					createToolbarCommand({
						id: "second-cancel",
						aggregationId: "selection-cancel",
						order: 20,
						label: "Cancel",
						execute: jest.fn(),
					}),
				],
			}),
		]);

		expect(groups[0].map((item) => item.label)).toEqual([
			"selection",
			"Confirm",
			"Cancel",
			"Clear",
		]);
	});

	it("keeps different interaction types in separate sections", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("selection", "selection"),
			contribution("dragging", "dragging"),
		]);

		expect(groups).toHaveLength(2);
		expect(groups.map((group) => group[0]?.id)).toEqual([
			"runtime-interaction-selection-menu",
			"runtime-interaction-dragging-menu",
		]);
	});

	it("batches multiple aggregate command updates and completes each one", async () => {
		const batchParameterValueUpdate = jest
			.fn()
			.mockResolvedValue(undefined);
		const firstPrepare = jest.fn();
		const secondPrepare = jest.fn();
		const firstComplete = jest.fn();
		const secondComplete = jest.fn();
		useShapeDiverStoreParameters.setState({batchParameterValueUpdate});
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				commands: [
					createToolbarCommand({
						id: "first-confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute: jest.fn(),
						batchUpdate: {
							namespace: "namespace",
							parameterId: "first",
							value: "first-value",
							prepare: firstPrepare,
							onComplete: firstComplete,
						},
					}),
				],
			}),
			contribution("second", "selection", {
				commands: [
					createToolbarCommand({
						id: "second-confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute: jest.fn(),
						batchUpdate: {
							namespace: "namespace",
							parameterId: "second",
							value: "second-value",
							prepare: secondPrepare,
							onComplete: secondComplete,
						},
					}),
				],
			}),
		]);

		const command = groups[0][1];
		if (command.type !== "command") throw new Error("Expected command");
		command.props.execute();
		expect(firstPrepare).toHaveBeenCalledTimes(1);
		expect(secondPrepare).toHaveBeenCalledTimes(1);
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			namespace: {first: "first-value", second: "second-value"},
		});
		await Promise.resolve();
		expect(firstComplete).toHaveBeenCalledTimes(1);
		expect(secondComplete).toHaveBeenCalledTimes(1);
	});

	it("shows a menu when at least one checkbox is toggleable", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				menuVisibility: "multipleToggleable",
				items: [
					createToolbarCheckboxItem({
						id: "toggle",
						label: "toggle",
						checked: false,
						setChecked: jest.fn(),
					}),
					createToolbarCheckboxItem({
						id: "locked",
						label: "locked",
						checked: false,
						setChecked: jest.fn(),
						readOnly: true,
					}),
				],
			}),
		]);

		expect(groups[0][0]?.type).toBe("menu");
	});

	it("sorts aggregated commands by the lowest order in each group", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("late", "selection", {
				commands: [
					createToolbarCommand({
						id: "late-a",
						aggregationId: "late",
						label: "Late",
						order: 10,
						execute: jest.fn(),
					}),
					createToolbarCommand({
						id: "late-b",
						aggregationId: "late",
						label: "Late",
						order: 30,
						execute: jest.fn(),
					}),
				],
			}),
			contribution("early", "selection", {
				commands: [
					createToolbarCommand({
						id: "early-a",
						aggregationId: "early",
						label: "Early",
						order: 5,
						execute: jest.fn(),
					}),
					createToolbarCommand({
						id: "early-b",
						aggregationId: "early",
						label: "Early",
						order: 100,
						execute: jest.fn(),
					}),
				],
			}),
		]);

		const commandLabels = groups[0]
			.filter((item) => item.type === "command")
			.map((item) => item.label);
		expect(commandLabels).toEqual(["Early", "Late"]);
	});

	it("keeps an aggregated command enabled when any member is enabled", () => {
		const enabledExecute = jest.fn();
		const disabledExecute = jest.fn();
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				commands: [
					createToolbarCommand({
						id: "enabled",
						aggregationId: "go",
						label: "Go",
						execute: enabledExecute,
					}),
					createToolbarCommand({
						id: "disabled",
						aggregationId: "go",
						label: "Go",
						disabled: true,
						execute: disabledExecute,
					}),
				],
			}),
		]);

		const command = groups[0].find((item) => item.type === "command");
		if (command?.type !== "command") throw new Error("Expected command");
		expect(command.disabled).toBeFalsy();
		command.props.execute();
		expect(enabledExecute).toHaveBeenCalledTimes(1);
		expect(disabledExecute).not.toHaveBeenCalled();
	});

	it("does not batch a single command that has batchUpdate", () => {
		const batchParameterValueUpdate = jest.fn();
		const execute = jest.fn();
		useShapeDiverStoreParameters.setState({batchParameterValueUpdate});
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				commands: [
					createToolbarCommand({
						id: "confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute,
						batchUpdate: {
							namespace: "namespace",
							parameterId: "first",
							value: "first-value",
							prepare: jest.fn(),
							onComplete: jest.fn(),
						},
					}),
				],
			}),
		]);

		const command = groups[0].find((item) => item.type === "command");
		if (command?.type !== "command") throw new Error("Expected command");
		command.props.execute();
		expect(execute).toHaveBeenCalledTimes(1);
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});

	it("does not batch when any aggregated member lacks batchUpdate", () => {
		const batchParameterValueUpdate = jest.fn();
		const firstExecute = jest.fn();
		const secondExecute = jest.fn();
		useShapeDiverStoreParameters.setState({batchParameterValueUpdate});
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				commands: [
					createToolbarCommand({
						id: "first-confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute: firstExecute,
						batchUpdate: {
							namespace: "namespace",
							parameterId: "first",
							value: "first-value",
							prepare: jest.fn(),
						},
					}),
					createToolbarCommand({
						id: "second-confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute: secondExecute,
					}),
				],
			}),
		]);

		const command = groups[0].find((item) => item.type === "command");
		if (command?.type !== "command") throw new Error("Expected command");
		command.props.execute();
		expect(firstExecute).toHaveBeenCalledTimes(1);
		expect(secondExecute).toHaveBeenCalledTimes(1);
		expect(batchParameterValueUpdate).not.toHaveBeenCalled();
	});

	it("hides the menu when extra items are not toggleable checkboxes", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				menuVisibility: "multipleToggleable",
				items: [
					createToolbarCommand({
						id: "confirm",
						label: "Confirm",
						execute: jest.fn(),
					}),
					createToolbarCheckboxItem({
						id: "locked",
						label: "locked",
						checked: true,
						readOnly: true,
						setChecked: jest.fn(),
					}),
				],
			}),
		]);

		expect(groups).toEqual([]);
	});

	it("sorts aggregated commands by min order when ranges overlap", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("wide", "selection", {
				commands: [
					createToolbarCommand({
						id: "wide-a",
						aggregationId: "wide",
						label: "Wide",
						order: 1,
						execute: jest.fn(),
					}),
					createToolbarCommand({
						id: "wide-b",
						aggregationId: "wide",
						label: "Wide",
						order: 100,
						execute: jest.fn(),
					}),
				],
			}),
			contribution("tight", "selection", {
				commands: [
					createToolbarCommand({
						id: "tight-a",
						aggregationId: "tight",
						label: "Tight",
						order: 10,
						execute: jest.fn(),
					}),
					createToolbarCommand({
						id: "tight-b",
						aggregationId: "tight",
						label: "Tight",
						order: 11,
						execute: jest.fn(),
					}),
				],
			}),
		]);

		const commandLabels = groups[0]
			.filter((item) => item.type === "command")
			.map((item) => item.label);
		expect(commandLabels).toEqual(["Wide", "Tight"]);
	});

	it("disables an aggregated command only when every member is disabled", () => {
		const firstExecute = jest.fn();
		const secondExecute = jest.fn();
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				commands: [
					createToolbarCommand({
						id: "first",
						aggregationId: "go",
						label: "Go",
						disabled: true,
						execute: firstExecute,
					}),
					createToolbarCommand({
						id: "second",
						aggregationId: "go",
						label: "Go",
						disabled: true,
						execute: secondExecute,
					}),
				],
			}),
		]);

		const command = groups[0].find((item) => item.type === "command");
		if (command?.type !== "command") throw new Error("Expected command");
		expect(command.disabled).toBe(true);
		command.props.execute();
		expect(firstExecute).not.toHaveBeenCalled();
		expect(secondExecute).not.toHaveBeenCalled();
	});

	it("batches without onComplete and still prepares each update", () => {
		const batchParameterValueUpdate = jest
			.fn()
			.mockResolvedValue(undefined);
		const prepare = jest.fn();
		useShapeDiverStoreParameters.setState({batchParameterValueUpdate});
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				commands: [
					createToolbarCommand({
						id: "first-confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute: jest.fn(),
						batchUpdate: {
							namespace: "namespace",
							parameterId: "first",
							value: "first-value",
							prepare,
						},
					}),
					createToolbarCommand({
						id: "second-confirm",
						aggregationId: "selection-confirm",
						label: "Confirm",
						execute: jest.fn(),
						batchUpdate: {
							namespace: "namespace",
							parameterId: "second",
							value: "second-value",
							prepare,
						},
					}),
				],
			}),
		]);

		const command = groups[0].find((item) => item.type === "command");
		if (command?.type !== "command") throw new Error("Expected command");
		expect(() => command.props.execute()).not.toThrow();
		expect(prepare).toHaveBeenCalledTimes(2);
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			namespace: {first: "first-value", second: "second-value"},
		});
	});

	it("uses menu.sectionId for the rendered section when it differs from menu.id", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				menu: {
					id: "menu-id",
					sectionId: "menu-section",
					label: "Selection",
				},
			}),
		]);

		const menu = groups[0][0];
		expect(menu.type).toBe("menu");
		if (menu.type !== "menu") throw new Error("Expected menu");
		expect(menu.props.sections[0].id).toBe("menu-section");
	});

	it("falls back to menu.id when sectionId is omitted", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				menu: {id: "menu-id", label: "Selection"},
			}),
		]);

		const menu = groups[0][0];
		expect(menu.type).toBe("menu");
		if (menu.type !== "menu") throw new Error("Expected menu");
		expect(menu.props.sections[0].id).toBe("menu-id");
	});

	it("merges consecutive sections that share a groupId", () => {
		const groups = resolveRuntimeToolbarGroups([
			contribution("selection", "selection", {groupId: "runtime"}),
			contribution("dragging", "dragging", {groupId: "runtime"}),
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0].map((item) => item.id)).toEqual([
			"runtime-interaction-selection-menu",
			"runtime-interaction-dragging-menu",
		]);
	});
});
