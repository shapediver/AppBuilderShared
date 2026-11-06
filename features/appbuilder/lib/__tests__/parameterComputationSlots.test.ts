/**
 * @jest-environment jsdom
 */

import {noteParameterCommitted} from "@AppBuilderLib/entities/parameter/model/parameterCommitNotice";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import type {IAppBuilderParameterControlActionSlots} from "../../config/appbuilderActionSlots";
import {
	APP_BUILDER_SLOT_EVENTS,
	APP_BUILDER_UI_EVENTS,
	type ComputationTaskEvent,
	createParameterComputationTaskFilter,
	logIgnoredActionSlotEvents,
} from "../appBuilderActionSlots";

const FAILED = "Session customization failed";
const SUPERSEDED = "The request was exceeded by another customization request";

const task = (
	id: string,
	extra: Partial<ComputationTaskEvent> = {},
): ComputationTaskEvent => ({
	id,
	type: "session_customization",
	category: "customize",
	data: {sessionId: "s1"},
	...extra,
});

const liveFilters: {dispose(): void}[] = [];

/** The session parameter: `value` is set by the executor before it customizes. */
function createParameter(initial: unknown, parameterId = "p1") {
	const parameter = {value: initial};
	const filter = createParameterComputationTaskFilter(
		"s1",
		parameterId,
		() => parameter.value,
	);
	liveFilters.push(filter);
	return {parameter, filter};
}

describe("parameter control computation slots", () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it("allows the UI and the computation events on a parameter control", () => {
		expect(APP_BUILDER_SLOT_EVENTS.parameterControl).toEqual([
			...APP_BUILDER_UI_EVENTS,
			"computationstart",
			"computationend",
			"computationerror",
		]);
		// the other controls do not gain them
		expect(APP_BUILDER_SLOT_EVENTS.control).toEqual(APP_BUILDER_UI_EVENTS);
	});

	it("does not warn about computation slots on a parameter control, but on other nodes", () => {
		const warn = jest.spyOn(Logger, "warn").mockImplementation(() => {});
		const slots = {
			computationend: {action: {type: "undo", props: {}}},
		} as IAppBuilderParameterControlActionSlots;

		logIgnoredActionSlotEvents(
			slots,
			APP_BUILDER_SLOT_EVENTS.parameterControl,
			"on this node",
		);
		expect(warn).not.toHaveBeenCalled();

		logIgnoredActionSlotEvents(
			slots,
			APP_BUILDER_SLOT_EVENTS.control,
			"on this node",
		);
		expect(warn).toHaveBeenCalledTimes(1);
	});
});

describe("createParameterComputationTaskFilter", () => {
	afterEach(() => {
		liveFilters.splice(0).forEach((filter) => filter.dispose());
	});

	it("starts only when the parameter changed", () => {
		const a = createParameter("1");
		const b = createParameter("1");
		a.parameter.value = "2";

		expect(a.filter.start(task("t1"))).toBe(true);
		expect(b.filter.start(task("t1"))).toBe(false);
		expect(a.filter.end(task("t1"))).toBe(true);
		expect(b.filter.end(task("t1"))).toBe(false);
	});

	it("remembers the computed value at the end", () => {
		const {parameter, filter} = createParameter("1");
		parameter.value = "2";
		expect(filter.start(task("t1"))).toBe(true);
		expect(filter.end(task("t1"))).toBe(true);

		// another parameter of the session changes, this one stays "2"
		expect(filter.start(task("t2"))).toBe(false);
		expect(filter.end(task("t2"))).toBe(false);

		parameter.value = "3";
		expect(filter.start(task("t3"))).toBe(true);
		expect(filter.end(task("t3"))).toBe(true);
	});

	it("remembers the uploaded file id, not the File the task started with", () => {
		const file = new File(["x"], "a.txt");
		const {parameter, filter} = createParameter("id-0");
		parameter.value = file;
		expect(filter.start(task("t1"))).toBe(true);
		// the viewer uploads the file during the customization
		parameter.value = "id-1";
		expect(filter.end(task("t1"))).toBe(true);

		expect(filter.start(task("t2"))).toBe(false);
	});

	it("does not roll back the value when an older task ends last", () => {
		const {parameter, filter} = createParameter("1");
		parameter.value = "2";
		expect(filter.start(task("t1"))).toBe(true);
		parameter.value = "3";
		expect(filter.start(task("t2"))).toBe(true);
		expect(filter.end(task("t2"))).toBe(true);
		expect(filter.end(task("t1"))).toBe(true);

		// another parameter changes, this one stays "3"
		expect(filter.start(task("t3"))).toBe(false);
	});

	it("keeps a value set while an earlier task ends as not computed yet", () => {
		const {parameter, filter} = createParameter("1");
		parameter.value = "2";
		expect(filter.start(task("t1"))).toBe(true);
		// the executor sets the next value, then uploads files before it starts the task
		parameter.value = "3";
		expect(filter.end(task("t1"))).toBe(true);
		expect(filter.start(task("t2"))).toBe(true);
		expect(filter.end(task("t2"))).toBe(true);
	});

	it("forgets a superseded customization, the newer one ends once", () => {
		const {parameter, filter} = createParameter("1");
		parameter.value = "2";
		expect(filter.start(task("t1"))).toBe(true);
		// the newer customization starts before the older one is cancelled
		expect(filter.start(task("t2"))).toBe(true);
		expect(filter.cancel(task("t1", {status: SUPERSEDED}))).toBe(false);
		expect(filter.end(task("t1"))).toBe(false);
		expect(filter.end(task("t2"))).toBe(true);
		expect(filter.end(task("t2"))).toBe(false);
	});

	it("includes the parameter in the newer customization after a superseded cancel", () => {
		const {parameter, filter} = createParameter("1");
		parameter.value = "2";
		expect(filter.start(task("t1"))).toBe(true);
		expect(filter.cancel(task("t1", {status: SUPERSEDED}))).toBe(false);
		expect(filter.start(task("t2"))).toBe(true);
		expect(filter.end(task("t2"))).toBe(true);
	});

	it("runs the error of a failed customization and keeps the last computed value", () => {
		const {parameter, filter} = createParameter("1");
		parameter.value = "2";
		expect(filter.start(task("t1"))).toBe(true);
		expect(filter.cancel(task("t1", {status: FAILED}))).toBe(true);
		expect(filter.end(task("t1"))).toBe(false);

		// the executor restores the previous value
		parameter.value = "1";
		expect(filter.start(task("t2"))).toBe(false);
		// a cancel of a task the parameter was not part of
		expect(filter.cancel(task("t2", {status: FAILED}))).toBe(false);
	});

	it("ignores instance computations, other sessions, and other task types", () => {
		const {parameter, filter} = createParameter("1");
		parameter.value = "2";
		expect(filter.start(task("t1", {category: "customize_parallel"}))).toBe(
			false,
		);
		expect(filter.start(task("t2", {data: {sessionId: "s2"}}))).toBe(false);
		expect(filter.start(task("t3", {type: "export_request"}))).toBe(false);
		expect(filter.end(task("t1"))).toBe(false);
	});

	it("does not depend on sessionValue (requestExports leaves it stale)", () => {
		// sessionValue stays "1" for the whole sequence
		const parameter = {value: "1", sessionValue: "1"};
		const filter = createParameterComputationTaskFilter(
			"s1",
			"exports",
			() => parameter.value,
		);
		liveFilters.push(filter);
		const exportsTask = (id: string) =>
			task(id, {category: "customize_via_exports"});

		parameter.value = "2";
		expect(filter.start(exportsTask("t1"))).toBe(true);
		expect(filter.end(exportsTask("t1"))).toBe(true);

		// back to the stale sessionValue: still a change
		parameter.value = "1";
		expect(filter.start(exportsTask("t2"))).toBe(true);
		expect(filter.end(exportsTask("t2"))).toBe(true);

		// unchanged since the last computation
		expect(filter.start(exportsTask("t3"))).toBe(false);
	});

	it("does not treat a commit without a computation as a later change", () => {
		const {parameter, filter} = createParameter("1", "committed");
		parameter.value = "2";
		expect(filter.start(task("t1"))).toBe(true);
		expect(filter.end(task("t1"))).toBe(true);

		parameter.value = "1";
		noteParameterCommitted("s1", "committed", "1");

		expect(filter.start(task("t2"))).toBe(false);
		expect(filter.end(task("t2"))).toBe(false);
	});

	it("keeps a commit made while the task is still running", () => {
		const {parameter, filter} = createParameter("1", "mid");
		parameter.value = "2";
		expect(filter.start(task("t1"))).toBe(true);
		parameter.value = "reset";
		noteParameterCommitted("s1", "mid", "reset");
		expect(filter.end(task("t1"))).toBe(true);

		expect(filter.start(task("t2"))).toBe(false);
	});
});
