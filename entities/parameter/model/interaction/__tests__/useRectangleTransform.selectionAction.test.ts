/**
 * @jest-environment jsdom
 */
import type {IRectangleTransformParameterProps} from "@shapediver/viewer.shared.types";
import {act, renderHook} from "@testing-library/react";
import {useMemo, useState} from "react";
import {exclusiveSelection} from "../exclusiveSelection";
import {
	applySelectionAction,
	resetSelectionActionTargets,
} from "../selectionActionRegistry";
import {useRectangleTransform} from "../useRectangleTransform";
import {useSelectionActionTarget} from "../useSelectionActionTarget";

const mockRectangleTransform = jest.fn();

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));
jest.mock(
	"@AppBuilderLib/entities/session/model/useShapeDiverStoreSession",
	() => ({
		useShapeDiverStoreSession: (
			selector: (state: {sessions: object}) => unknown,
		) => selector({sessions: {session: {}}}),
	}),
);
const mockViewportApi = {
	id: "viewport",
	render: jest.fn(),
	addFlag: jest.fn(() => "camera-freeze"),
	removeFlag: jest.fn(),
};
jest.mock(
	"@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport",
	() => ({
		useShapeDiverStoreViewport: (
			selector: (state: {viewports: object}) => unknown,
		) => selector({viewports: {viewport: mockViewportApi}}),
	}),
);
jest.mock("@shapediver/viewer.features.interaction", () => ({
	getNodesByName: () => [],
	matchNodesWithPatterns: () => [],
	RESTRICTION_TYPE: {PLANE: "plane"},
}));
jest.mock("@shapediver/viewer.features.transformation-tools", () => ({
	RectangleTransform: jest.fn().mockImplementation((...args: unknown[]) => {
		mockRectangleTransform(...args);
		return {closed: false, close: jest.fn(), pause: jest.fn()};
	}),
	updateTransformation: jest.fn(),
}));
jest.mock("@shapediver/viewer.session", () => ({
	addListener: jest.fn(),
	removeListener: jest.fn(),
	EVENTTYPE_VIEWPORT: {VIEWPORT_UPDATED: "viewport.updated"},
	EVENTTYPE_INTERACTION: {HOVER_ON: "hoverOn", SELECT_ON: "selectOn"},
	EVENTTYPE_TRANSFORMATION_TOOLS: {
		HOVER_CHANGED: "hoverChanged",
		GESTURE_START: "gestureStart",
	},
	FLAG_TYPE: {CAMERA_FREEZE: "cameraFreeze"},
}));
jest.mock("../../drawing/useRestrictions", () => ({
	useRestrictions: () => ({restrictions: undefined}),
}));
const mockDraggingData = {objects: []};
jest.mock("../useConvertDraggingData", () => ({
	useConvertDraggingData: () => mockDraggingData,
}));
jest.mock("../useRectangleTransformEvents", () => {
	const {useState} = jest.requireActual("react");

	return {
		useRectangleTransformEvents: () => {
			const [transformedNodeNames, setTransformedNodeNames] = useState(
				[],
			);

			return {transformedNodeNames, setTransformedNodeNames};
		},
	};
});
// one candidate node per name filter entry; a user click is not simulated
jest.mock("../useSelection", () => ({
	useSelection: (_viewportId: string, settings: {nameFilter: string[]}) =>
		mockUseSelection(settings.nameFilter),
}));
jest.mock(
	"@AppBuilderLib/entities/parameter/lib/findNodesByNameFilter",
	() => ({
		findNamedNodesByNameFilter: (filters: string[] = []) =>
			filters.map((name) => ({name, node: {name}})),
	}),
);
jest.mock("../../useShapeDiverStoreParameters", () => ({
	useShapeDiverStoreParameters: {
		getState: () => ({
			getParameter: (namespace: string, name: string) =>
				namespace === "session"
					? {getState: () => ({definition: {id: name}})}
					: undefined,
		}),
	},
}));

const nodes: {[name: string]: object} = {};
const sceneNode = (name: string) =>
	(nodes[name] ??= {
		id: `id-${name}`,
		name,
		boundingBox: {isEmpty: () => false},
	});

function mockUseSelection(nameFilter: string[]) {
	const [selectedNodeNames, setSelectedNodeNames] = useState<string[]>([]);
	const key = nameFilter.join(",");
	const candidateNodes = useMemo(
		() =>
			nameFilter.map((name) => ({
				nodeId: `id-${name}`,
				name,
				node: sceneNode(name),
			})),
		[key],
	);
	const availableNodeNames = useMemo(
		() => ({session: {output: [...nameFilter]}}),
		[key],
	);

	return {
		candidateNodes,
		selectedNodeNames,
		setSelectedNodeNames,
		availableNodeNames,
	};
}

const rectangleProps = (
	box: string,
	options: Partial<IRectangleTransformParameterProps> = {},
) =>
	({
		activeMode: "alwaysActive",
		exclusive: true,
		nameFilter: [box],
		...options,
	}) as IRectangleTransformParameterProps;

const PROPS = {
	First: rectangleProps("Boxes.box_1", {minimumSelection: 1}),
	Second: rectangleProps("Boxes.box_2", {minimumSelection: 1}),
	Optional: rectangleProps("Boxes.box_3"),
};

/** The rectangle transform part of ParameterRectangleTransformComponent. */
function useParameter(name: keyof typeof PROPS) {
	const props = PROPS[name];
	const state = useRectangleTransform(["session"], "viewport", props, true);
	useSelectionActionTarget({
		ownerKey: name,
		candidateNodes: state.candidateNodes,
		selectedNodeNames: state.selectedNodeNames,
		maximumSelection: props.maximumSelection ?? 1,
		setSelectedNames: state.setSelectedNodeNames,
		parameter: {namespace: "session", id: name, name},
	});

	return state.selectedNodeNames;
}

const renderParameters = () =>
	renderHook(() => ({
		First: useParameter("First"),
		Second: useParameter("Second"),
		Optional: useParameter("Optional"),
	}));

const run = (
	name: keyof typeof PROPS,
	request: {select?: string[]; deselect?: string[]},
) =>
	act(() => {
		applySelectionAction(
			{...request, parameter: {name, sessionId: "session"}},
			{namespace: "session"},
		);
	});

const lastGizmoNodes = () => mockRectangleTransform.mock.lastCall?.[1];

describe("selection action on an exclusive rectangle transform", () => {
	beforeEach(() => {
		resetSelectionActionTargets();
		exclusiveSelection.reset();
		mockRectangleTransform.mockClear();
	});

	it("starts without a selection and without a rectangle", () => {
		const {result} = renderParameters();

		expect(result.current).toEqual({First: [], Second: [], Optional: []});
		expect(exclusiveSelection.getHolder("viewport")).toBeUndefined();
		expect(mockRectangleTransform).not.toHaveBeenCalled();
	});

	it("selects the node and shows its rectangle as a selection", () => {
		const {result} = renderParameters();

		run("First", {select: ["Boxes.box_1"]});

		expect(result.current.First).toEqual(["Boxes.box_1"]);
		expect(exclusiveSelection.getHolder("viewport")).toBeDefined();
		expect(lastGizmoNodes()).toEqual([sceneNode("Boxes.box_1")]);
	});

	it("deselects the previous parameter, also with a minimum selection of 1", () => {
		const {result} = renderParameters();
		run("First", {select: ["Boxes.box_1"]});
		const firstHolder = exclusiveSelection.getHolder("viewport");

		run("Second", {select: ["Boxes.box_2"]});

		expect(result.current.First).toEqual([]);
		expect(result.current.Second).toEqual(["Boxes.box_2"]);
		expect(exclusiveSelection.getHolder("viewport")).not.toBe(firstHolder);
		expect(lastGizmoNodes()).toEqual([sceneNode("Boxes.box_2")]);
	});

	it("hands the viewport over to a parameter without a minimum", () => {
		const {result} = renderParameters();
		run("Optional", {select: ["Boxes.box_3"]});

		run("First", {select: ["Boxes.box_1"]});

		expect(result.current.Optional).toEqual([]);
		expect(result.current.First).toEqual(["Boxes.box_1"]);
	});

	it("deselects even when a click would keep the minimum selection", () => {
		const {result} = renderParameters();
		run("First", {select: ["Boxes.box_1"]});

		run("First", {deselect: ["Boxes.box_1"]});

		expect(result.current.First).toEqual([]);
		expect(exclusiveSelection.getHolder("viewport")).toBeUndefined();
	});

	it("deselects to empty without a minimum selection and releases the viewport", () => {
		const {result} = renderParameters();
		run("Optional", {select: ["Boxes.box_3"]});

		run("Optional", {deselect: ["Boxes.box_3"]});

		expect(result.current.Optional).toEqual([]);
		expect(exclusiveSelection.getHolder("viewport")).toBeUndefined();
	});
});
