/**
 * @jest-environment jsdom
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
							prepare: jest.fn(),
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
							prepare: jest.fn(),
							onComplete: secondComplete,
						},
					}),
				],
			}),
		]);

		const command = groups[0][1];
		if (command.type !== "command") throw new Error("Expected command");
		command.props.execute();
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			namespace: {first: "first-value", second: "second-value"},
		});
		await Promise.resolve();
		expect(firstComplete).toHaveBeenCalledTimes(1);
		expect(secondComplete).toHaveBeenCalledTimes(1);
	});
});
