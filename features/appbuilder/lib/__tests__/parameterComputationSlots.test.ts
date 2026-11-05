/**
 * @jest-environment jsdom
 */

import {Logger} from "@AppBuilderLib/shared/lib/logger";
import type {IAppBuilderParameterControlActionSlots} from "../../config/appbuilderActionSlots";
import {
	APP_BUILDER_PARAMETER_COMPUTATION_EVENTS,
	APP_BUILDER_SLOT_EVENTS,
	APP_BUILDER_UI_EVENTS,
	logIgnoredActionSlotEvents,
	omitParameterComputationSlots,
	pickParameterComputationSlots,
} from "../appBuilderActionSlots";

const undo = {type: "undo" as const, props: {}};

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

	it("picks the computation slots in event order, arrays included", () => {
		const slots: IAppBuilderParameterControlActionSlots = {
			click: {action: undo},
			computationerror: {action: undo},
			computationend: [{action: undo}, {action: undo}],
		};
		expect(
			pickParameterComputationSlots(slots).map(
				({eventName, index}) => `${eventName}#${index}`,
			),
		).toEqual([
			"computationend#0",
			"computationend#1",
			"computationerror#2",
		]);
		expect(pickParameterComputationSlots(undefined)).toEqual([]);
		expect(pickParameterComputationSlots({click: {action: undo}})).toEqual(
			[],
		);
	});

	it("skips and warns about a slot with eventProps", () => {
		const warn = jest.spyOn(Logger, "warn").mockImplementation(() => {});
		const slots = {
			computationend: {
				action: undo,
				eventProps: {type: "session", props: {sessionId: "s1"}},
			},
		} as unknown as IAppBuilderParameterControlActionSlots;
		expect(pickParameterComputationSlots(slots)).toEqual([]);
		expect(warn).toHaveBeenCalledTimes(1);
	});

	it("omits the computation slots for the DOM wrapper", () => {
		const slots: IAppBuilderParameterControlActionSlots = {
			click: {action: undo},
			"custom:item-selected": {action: undo},
			computationstart: {action: undo},
			computationend: {action: undo},
			computationerror: {action: undo},
		};
		const rest = omitParameterComputationSlots(slots);
		expect(Object.keys(rest ?? {})).toEqual([
			"click",
			"custom:item-selected",
		]);
		// the original is not changed
		expect(Object.keys(slots)).toHaveLength(5);
		expect(omitParameterComputationSlots(undefined)).toBeUndefined();
		for (const eventName of APP_BUILDER_PARAMETER_COMPUTATION_EVENTS) {
			expect(rest).not.toHaveProperty(eventName);
		}
	});

	it("does not warn about computation slots on a parameter control, but on other nodes", () => {
		const warn = jest.spyOn(Logger, "warn").mockImplementation(() => {});
		const slots = {
			computationend: {action: undo},
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
