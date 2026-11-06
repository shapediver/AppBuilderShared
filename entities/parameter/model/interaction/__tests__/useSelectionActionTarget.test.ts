/**
 * @jest-environment jsdom
 */
import type {ITreeNode} from "@shapediver/viewer.session";
import {renderHook} from "@testing-library/react";
import {
	applySelectionAction,
	resetSelectionActionTargets,
} from "../selectionActionRegistry";
import {
	useSelectionActionTarget,
	type UseSelectionActionTargetProps,
} from "../useSelectionActionTarget";

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));
jest.mock("../../useShapeDiverStoreParameters", () => ({
	useShapeDiverStoreParameters: {
		getState: () => ({
			getParameter: (namespace: string, name: string) =>
				namespace === "session" && name === "Boxes"
					? {getState: () => ({definition: {id: "boxes"}})}
					: undefined,
		}),
	},
}));
// each filter string stands for one scene node of that name
jest.mock(
	"@AppBuilderLib/entities/parameter/lib/findNodesByNameFilter",
	() => ({
		findNamedNodesByNameFilter: (filters: string[] = []) =>
			filters.map((name) => ({name, node: {name}})),
	}),
);

const createProps = (
	overrides: Partial<UseSelectionActionTargetProps> = {},
): UseSelectionActionTargetProps => ({
	ownerKey: "owner",
	candidateNodes: ["Boxes.1", "Boxes.2"].map((name) => ({
		name,
		node: {name} as unknown as ITreeNode,
	})),
	selectedNodeNames: [],
	maximumSelection: 2,
	setSelectedNames: jest.fn(),
	parameter: {namespace: "session", id: "boxes", name: "Boxes"},
	...overrides,
});

const run = (
	request: Parameters<typeof applySelectionAction>[0],
	context: Partial<Parameters<typeof applySelectionAction>[1]> = {},
) => applySelectionAction(request, {namespace: "session", ...context});

const runOnParameter = (request: Parameters<typeof applySelectionAction>[0]) =>
	run({parameter: {name: "Boxes"}, ...request});

describe("useSelectionActionTarget", () => {
	beforeEach(() => resetSelectionActionTargets());

	it("registers the parameter while it is mounted", () => {
		const props = createProps();
		const {unmount} = renderHook(() => useSelectionActionTarget(props));

		expect(runOnParameter({select: ["Boxes.1"]})).toEqual(["boxes"]);
		expect(props.setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);

		unmount();

		expect(runOnParameter({select: ["Boxes.2"]})).toEqual([]);
	});

	it("is not used when the action does not name the parameter", () => {
		const props = createProps();
		renderHook(() => useSelectionActionTarget(props));

		expect(run({select: ["Boxes.1"]})).toEqual([]);
		expect(props.setSelectedNames).not.toHaveBeenCalled();
	});

	it("registers a root group when no parameter is set", () => {
		const setSelectedNames = jest.fn();
		const props = createProps({
			parameter: undefined,
			setSelectedNames,
			ownerKey: "root",
		});
		renderHook(() => useSelectionActionTarget(props));

		expect(run({select: ["Boxes.1"]})).toEqual(["root"]);
		expect(setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);
		expect(runOnParameter({select: ["Boxes.2"]})).toEqual([]);
	});

	it("uses the selection of the latest render", () => {
		const setSelectedNames = jest.fn();
		const {rerender} = renderHook(
			(props: UseSelectionActionTargetProps) =>
				useSelectionActionTarget(props),
			{initialProps: createProps({setSelectedNames})},
		);

		rerender(
			createProps({
				setSelectedNames,
				selectedNodeNames: ["Boxes.1"],
			}),
		);
		runOnParameter({deselect: ["Boxes.1"]});

		expect(setSelectedNames).toHaveBeenCalledWith([]);
	});

	it("lets actions in a row see the selection before the next render", () => {
		const setSelectedNames = jest.fn();
		renderHook(() =>
			useSelectionActionTarget(createProps({setSelectedNames})),
		);

		runOnParameter({select: ["Boxes.1"]});
		runOnParameter({select: ["Boxes.2"]});

		expect(setSelectedNames).toHaveBeenLastCalledWith([
			"Boxes.1",
			"Boxes.2",
		]);
	});

	it("ignores a scene node which is not a candidate", () => {
		const setSelectedNames = jest.fn();
		renderHook(() =>
			useSelectionActionTarget(createProps({setSelectedNames})),
		);

		expect(runOnParameter({select: ["Boxes.1", "Other"]})).toEqual([
			"boxes",
		]);
		expect(setSelectedNames).toHaveBeenCalledWith(["Boxes.1"]);
	});
});
