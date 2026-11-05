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
	useShapeDiverStoreParameters: {getState: () => ({})},
}));
// the nodes of the tests carry their name
jest.mock("../selectionNameMatcher", () => ({
	matchSelectionNames: (filters: string[], nodes: {name: string}[]) =>
		new Set(
			nodes
				.map(({name}) => name)
				.filter((name) => filters.includes(name)),
		),
}));

const createProps = (
	overrides: Partial<UseSelectionActionTargetProps> = {},
): UseSelectionActionTargetProps => ({
	ownerKey: "owner",
	namespace: "session",
	parameterId: "boxes",
	parameterName: "Boxes",
	candidateNodes: ["Boxes.1", "Boxes.2"].map((name) => ({
		name,
		node: {name} as unknown as ITreeNode,
	})),
	selectedNodeNames: [],
	maximumSelection: 2,
	setSelectedNodeNames: jest.fn(),
	...overrides,
});

const run = (request: Parameters<typeof applySelectionAction>[0]) =>
	applySelectionAction(request, {namespace: "session"});

describe("useSelectionActionTarget", () => {
	beforeEach(() => resetSelectionActionTargets());

	it("registers the parameter while it is mounted", () => {
		const props = createProps();
		const {unmount} = renderHook(() => useSelectionActionTarget(props));

		expect(run({select: ["Boxes.1"]})).toEqual(["boxes"]);
		expect(props.setSelectedNodeNames).toHaveBeenCalledWith(["Boxes.1"]);

		unmount();

		expect(run({select: ["Boxes.2"]})).toEqual([]);
	});

	it("uses the selection of the latest render", () => {
		const setSelectedNodeNames = jest.fn();
		const {rerender} = renderHook(
			(props: UseSelectionActionTargetProps) =>
				useSelectionActionTarget(props),
			{initialProps: createProps({setSelectedNodeNames})},
		);

		rerender(
			createProps({
				setSelectedNodeNames,
				selectedNodeNames: ["Boxes.1"],
			}),
		);
		run({deselect: ["Boxes.1"]});

		expect(setSelectedNodeNames).toHaveBeenCalledWith([]);
	});

	it("lets actions in a row see the selection before the next render", () => {
		const setSelectedNodeNames = jest.fn();
		renderHook(() =>
			useSelectionActionTarget(createProps({setSelectedNodeNames})),
		);

		run({select: ["Boxes.1"]});
		run({select: ["Boxes.2"]});

		expect(setSelectedNodeNames).toHaveBeenLastCalledWith([
			"Boxes.1",
			"Boxes.2",
		]);
	});
});
