type Handler = (event: unknown) => void;

const handlers: Record<string, Handler[]> = {};
const mockRemoveListener = jest.fn();

jest.mock("@shapediver/viewer.session", () => ({
	EVENTTYPE: {
		TASK: {
			TASK_START: "task.start",
			TASK_END: "task.end",
			TASK_CANCEL: "task.cancel",
		},
	},
	addListener: jest.fn((type: string, handler: Handler) => {
		(handlers[type] ??= []).push(handler);
		return `${type}#${handlers[type].length}`;
	}),
	removeListener: (token: string) => mockRemoveListener(token),
}));

import {
	addParameterComputationListener,
	markParametersInCustomization,
	resetParameterComputationEvents,
	unmarkParametersInCustomization,
	type ParameterComputationEvent,
} from "../parameterComputationEvents";

const FAILED = "Session customization failed";
const SUPERSEDED = "The request was exceeded by another customization request";

function emit(
	type: "task.start" | "task.end" | "task.cancel",
	data: {
		sessionId?: string;
		category?: string;
		status?: string;
		type?: string;
	},
) {
	const {sessionId, category = "customize", status, type: taskType} = data;
	for (const handler of handlers[type] ?? []) {
		handler({
			type: taskType ?? "session_customization",
			category,
			data: sessionId === undefined ? undefined : {sessionId},
			status,
		});
	}
}

function record() {
	const events: Record<
		"start" | "end" | "error",
		ParameterComputationEvent[]
	> = {start: [], end: [], error: []};
	for (const type of ["start", "end", "error"] as const) {
		addParameterComputationListener(type, (event) =>
			events[type].push(event),
		);
	}
	return events;
}

describe("parameterComputationEvents", () => {
	beforeEach(() => {
		resetParameterComputationEvents();
		for (const key of Object.keys(handlers)) delete handlers[key];
		mockRemoveListener.mockClear();
	});

	it("reports the marked parameters on start and end", () => {
		const events = record();
		markParametersInCustomization("s1", ["a", "b"]);

		emit("task.start", {sessionId: "s1"});
		expect(events.start).toEqual([
			{sessionId: "s1", parameterIds: ["a", "b"]},
		]);
		expect(events.end).toEqual([]);

		emit("task.end", {sessionId: "s1"});
		expect(events.end).toEqual([
			{sessionId: "s1", parameterIds: ["a", "b"]},
		]);
		expect(events.error).toEqual([]);
	});

	it("does not report a parameter of another customization", () => {
		const events = record();
		markParametersInCustomization("s1", ["a"]);
		emit("task.end", {sessionId: "s1"});

		markParametersInCustomization("s1", ["b"]);
		emit("task.end", {sessionId: "s1"});

		expect(events.end.map((event) => event.parameterIds)).toEqual([
			["a"],
			["b"],
		]);
	});

	it("keeps the sessions apart", () => {
		const events = record();
		markParametersInCustomization("s1", ["a"]);
		markParametersInCustomization("s2", ["b"]);

		emit("task.end", {sessionId: "s2"});
		expect(events.end).toEqual([{sessionId: "s2", parameterIds: ["b"]}]);
		emit("task.end", {sessionId: "s1"});
		expect(events.end[1]).toEqual({sessionId: "s1", parameterIds: ["a"]});
	});

	it("reports nothing without marked parameters", () => {
		const events = record();
		emit("task.start", {sessionId: "s1"});
		emit("task.end", {sessionId: "s1"});
		emit("task.cancel", {sessionId: "s1", status: FAILED});
		expect(events).toEqual({start: [], end: [], error: []});
	});

	it("reports a failed customization as error and not as end", () => {
		const events = record();
		markParametersInCustomization("s1", ["a"]);

		emit("task.cancel", {sessionId: "s1", status: FAILED});

		expect(events.error).toEqual([{sessionId: "s1", parameterIds: ["a"]}]);
		expect(events.end).toEqual([]);

		// the parameters are done: a later customization does not repeat them
		emit("task.end", {sessionId: "s1"});
		expect(events.end).toEqual([]);
	});

	it("carries the parameters of a superseded customization over", () => {
		const events = record();
		markParametersInCustomization("s1", ["a"]);
		emit("task.start", {sessionId: "s1"});

		// a newer customization replaces the first one
		emit("task.cancel", {sessionId: "s1", status: SUPERSEDED});
		expect(events.error).toEqual([]);
		expect(events.end).toEqual([]);

		markParametersInCustomization("s1", ["b"]);
		emit("task.start", {sessionId: "s1"});
		emit("task.end", {sessionId: "s1"});

		expect(events.end).toEqual([
			{sessionId: "s1", parameterIds: ["a", "b"]},
		]);
		expect(events.error).toEqual([]);
	});

	it("reports each parameter of a failed customization that replaced another", () => {
		const events = record();
		markParametersInCustomization("s1", ["a"]);
		emit("task.cancel", {sessionId: "s1", status: SUPERSEDED});
		markParametersInCustomization("s1", ["b"]);
		emit("task.cancel", {sessionId: "s1", status: FAILED});

		expect(events.error).toEqual([
			{sessionId: "s1", parameterIds: ["a", "b"]},
		]);
	});

	it("ignores instance computations and other task types", () => {
		const events = record();
		markParametersInCustomization("s1", ["a"]);

		emit("task.start", {sessionId: "s1", category: "customize_parallel"});
		emit("task.end", {sessionId: "s1", category: "customize_parallel"});
		emit("task.end", {sessionId: "s1", type: "export_request"});
		expect(events.end).toEqual([]);

		emit("task.end", {sessionId: "s1", category: "customize_via_exports"});
		expect(events.end).toEqual([{sessionId: "s1", parameterIds: ["a"]}]);
	});

	it("ignores a task without session id", () => {
		const events = record();
		markParametersInCustomization("s1", ["a"]);
		emit("task.end", {});
		expect(events.end).toEqual([]);
	});

	it("forgets unmarked parameters", () => {
		const events = record();
		markParametersInCustomization("s1", ["a", "b"]);
		unmarkParametersInCustomization("s1", ["a"]);
		emit("task.end", {sessionId: "s1"});
		expect(events.end).toEqual([{sessionId: "s1", parameterIds: ["b"]}]);
	});

	it("stops reporting to a removed listener", () => {
		const listener = jest.fn();
		const remove = addParameterComputationListener("end", listener);
		markParametersInCustomization("s1", ["a"]);
		remove();
		emit("task.end", {sessionId: "s1"});
		expect(listener).not.toHaveBeenCalled();
	});

	it("registers the viewer listeners once and removes them on reset", () => {
		markParametersInCustomization("s1", ["a"]);
		markParametersInCustomization("s1", ["b"]);
		expect(handlers["task.start"]).toHaveLength(1);
		expect(handlers["task.end"]).toHaveLength(1);
		expect(handlers["task.cancel"]).toHaveLength(1);

		resetParameterComputationEvents();
		expect(mockRemoveListener).toHaveBeenCalledTimes(3);
	});
});
