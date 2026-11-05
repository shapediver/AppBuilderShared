/**
 * @jest-environment jsdom
 */
import {SelectManager} from "@shapediver/viewer.features.interaction";
import {act, renderHook} from "@testing-library/react";
import type {IUseCreateNameFilterPatternResult} from "../useCreateNameFilterPattern";
import {useSelectManagerEvents} from "../useSelectManagerEvents";

type Listener = (event: unknown) => void;
const mockListeners = new Map<string, Map<string, Listener>>();

jest.mock("@shapediver/viewer.session", () => {
	let token = 0;
	return {
		EVENTTYPE_INTERACTION: {
			SELECT_ON: "SELECT_ON",
			SELECT_OFF: "SELECT_OFF",
			MULTI_SELECT_ON: "MULTI_SELECT_ON",
			MULTI_SELECT_OFF: "MULTI_SELECT_OFF",
		},
		addListener: (type: string, cb: Listener) => {
			const id = `${++token}`;
			if (!mockListeners.has(type)) mockListeners.set(type, new Map());
			mockListeners.get(type)!.set(id, cb);
			return id;
		},
		removeListener: (id: string) =>
			mockListeners.forEach((listeners) => listeners.delete(id)),
	};
});

jest.mock("@shapediver/viewer.features.interaction", () => ({
	SelectManager: class {},
	MultiSelectManager: class {},
	matchNodesWithPatterns: (_pattern: unknown, nodes: {name: string}[]) =>
		nodes.map((node) => node.name),
}));

const emit = (type: string, event: unknown) =>
	mockListeners.get(type)?.forEach((cb) => cb(event));

const patterns = {
	outputPatterns: {session: {}},
} as unknown as IUseCreateNameFilterPatternResult;
const manager = Object.assign(new SelectManager(), {
	id: "component",
	select: jest.fn(),
});
const nodeA = {name: "a"};
const nodeB = {name: "b"};
const pointerEvent = {};

const renderEvents = (keptMinimumSelection: number) =>
	renderHook(() =>
		useSelectManagerEvents(
			patterns,
			"component",
			["a"],
			true,
			true,
			manager as never,
			keptMinimumSelection,
		),
	);

/** A deselection by the user, as emitted by the select manager. */
const deselect = (node: {name: string}) =>
	emit("SELECT_OFF", {
		manager,
		node,
		event: pointerEvent,
		reselection: false,
	});
const select = (node: {name: string}) =>
	emit("SELECT_ON", {manager, node, event: pointerEvent});

describe("useSelectManagerEvents with a kept minimum selection", () => {
	beforeEach(() => {
		mockListeners.clear();
		manager.select.mockClear();
	});

	it("refuses a deselection below the minimum", async () => {
		const {result} = renderEvents(1);

		await act(async () => deselect(nodeA));

		expect(result.current.selectedNodeNames).toEqual(["a"]);
		expect(manager.select).toHaveBeenCalledWith(
			expect.objectContaining({node: nodeA}),
		);
	});

	it("replaces the selection when another object is clicked", async () => {
		const {result} = renderEvents(1);

		await act(async () => {
			deselect(nodeA);
			select(nodeB);
		});

		expect(result.current.selectedNodeNames).toEqual(["b"]);
		expect(manager.select).not.toHaveBeenCalled();
	});

	it("clears the selection set by the component (e.g. a removed node)", async () => {
		const {result} = renderEvents(1);

		await act(async () => result.current.setSelectedNodeNames([]));

		expect(result.current.selectedNodeNames).toEqual([]);
	});

	it("deselects without a minimum", async () => {
		const {result} = renderEvents(0);

		await act(async () => deselect(nodeA));

		expect(result.current.selectedNodeNames).toEqual([]);
		expect(manager.select).not.toHaveBeenCalled();
	});
});
