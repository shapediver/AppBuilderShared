/**
 * @jest-environment jsdom
 */
import {createToolbarCheckboxItem, createToolbarCommand} from "../createToolbarItems";
import {resolveRuntimeToolbarGroups} from "../resolveRuntimeToolbarGroups";
import type {RuntimeToolbarContribution} from "../runtimeToolbarContributionRegistry";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";

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
	items: [createToolbarCheckboxItem({
		id: `${id}-toggle`,
		label: id,
		checked: false,
		setChecked: jest.fn(),
	})],
	...overrides,
});

describe("resolveRuntimeToolbarGroups", () => {
	it("combines selection parameters into one menu and aggregate commands", () => {
		const firstConfirm = jest.fn();
		const secondConfirm = jest.fn();
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				menuVisibility: "multipleToggleable",
				commands: [createToolbarCommand({
					id: "first-confirm",
					aggregationId: "selection-confirm",
					label: "Confirm",
					execute: firstConfirm,
				})],
			}),
			contribution("second", "selection", {
				menuVisibility: "multipleToggleable",
				commands: [createToolbarCommand({
					id: "second-confirm",
					aggregationId: "selection-confirm",
					label: "Confirm",
					execute: secondConfirm,
				})],
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
				items: [createToolbarCheckboxItem({
					id: "first-toggle",
					label: "First",
					checked: true,
					readOnly: true,
					setChecked: jest.fn(),
				})],
			}),
			contribution("second", "selection", {
				menuVisibility: "multipleToggleable",
				items: [createToolbarCheckboxItem({
					id: "second-toggle",
					label: "Second",
					checked: true,
					readOnly: true,
					setChecked: jest.fn(),
				})],
			}),
		]);

		expect(groups).toEqual([[]]);
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

	it("batches multiple aggregate command updates", () => {
		const batchParameterValueUpdate = jest.fn();
		useShapeDiverStoreParameters.setState({batchParameterValueUpdate});
		const groups = resolveRuntimeToolbarGroups([
			contribution("first", "selection", {
				commands: [createToolbarCommand({
					id: "first-confirm",
					aggregationId: "selection-confirm",
					label: "Confirm",
					execute: jest.fn(),
					batchUpdate: {
						namespace: "namespace",
						parameterId: "first",
						value: "first-value",
						prepare: jest.fn(),
					},
				})],
			}),
			contribution("second", "selection", {
				commands: [createToolbarCommand({
					id: "second-confirm",
					aggregationId: "selection-confirm",
					label: "Confirm",
					execute: jest.fn(),
					batchUpdate: {
						namespace: "namespace",
						parameterId: "second",
						value: "second-value",
						prepare: jest.fn(),
					},
				})],
			}),
		]);

		const command = groups[0][1];
		if (command.type !== "command") throw new Error("Expected command");
		command.props.execute();
		expect(batchParameterValueUpdate).toHaveBeenCalledWith({
			namespace: {first: "first-value", second: "second-value"},
		});
	});
});
