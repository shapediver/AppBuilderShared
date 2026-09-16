/**
 * @jest-environment jsdom
 */

import type {IAppBuilderActionSlots} from "../../config/appbuilderActionSlots";
import {
	APP_BUILDER_APPLICATION_EVENTS,
	APP_BUILDER_SLOT_EVENTS,
	APP_BUILDER_UI_EVENTS,
	APP_BUILDER_UI_EVENT_REACT_PROPS,
	logIgnoredActionSlotEvents,
	matchesExportName,
	matchesSessionFilter,
	pickAllowedActionSlots,
	readStringField,
	uiSlotDomProps,
} from "../appBuilderActionSlots";

const slots: IAppBuilderActionSlots = {
	click: {
		action: {type: "undo", props: {}},
	},
	appready: {
		action: {type: "undo", props: {}},
	},
	"custom:item-selected": {
		action: {type: "undo", props: {}},
	},
};

describe("appBuilderActionSlots helpers", () => {
	it("derives UI event names from the React prop map", () => {
		expect(APP_BUILDER_UI_EVENTS).toEqual(
			Object.keys(APP_BUILDER_UI_EVENT_REACT_PROPS),
		);
	});

	it("picks only allowed event names", () => {
		expect(pickAllowedActionSlots(slots, ["click", "pointerdown"])).toEqual(
			[
				{
					eventName: "click",
					slot: slots.click,
				},
			],
		);
	});

	it("matches session filters using the controller session as default", () => {
		expect(
			matchesSessionFilter("controller", undefined, "controller"),
		).toBe(true);
		expect(matchesSessionFilter("other", undefined, "controller")).toBe(
			false,
		);
		expect(matchesSessionFilter("other", "other", "controller")).toBe(true);
		expect(matchesSessionFilter(undefined, "other", "controller")).toBe(
			false,
		);
		expect(matchesSessionFilter(undefined, undefined, "controller")).toBe(
			true,
		);
	});

	it("matches export identities case-insensitively", () => {
		expect(
			matchesExportName(
				{id: "exp-1", name: "Download", displayname: "GLB"},
				"download",
			),
		).toBe(true);
		expect(matchesExportName({id: "exp-1", name: "Download"}, "glb")).toBe(
			false,
		);
		expect(matchesExportName({id: "exp-1"}, undefined)).toBe(true);
	});

	it("builds React DOM props for enabled UI events only", () => {
		const run = jest.fn();
		const props = uiSlotDomProps(run, new Set(["click", "pointerleave"]));
		expect(Object.keys(props).sort()).toEqual([
			"onClick",
			"onPointerLeave",
		]);
		props.onClick?.();
		props.onPointerLeave?.();
		expect(run.mock.calls).toEqual([["click"], ["pointerleave"]]);
	});

	it("prevents the default browser menu for contextmenu", () => {
		const run = jest.fn();
		const preventDefault = jest.fn();
		const props = uiSlotDomProps(run, new Set(["contextmenu"]));
		expect(Object.keys(props)).toEqual(["onContextMenu"]);
		props.onContextMenu?.({preventDefault});
		expect(preventDefault).toHaveBeenCalledTimes(1);
		expect(run).toHaveBeenCalledWith("contextmenu");
	});

	it("reads string fields from nested task data without matching unrelated id", () => {
		expect(
			readStringField(
				{session: {sessionId: "abc"}, export: {name: "GLB"}},
				["sessionId", "session"],
			),
		).toBe("abc");
		expect(
			readStringField({exportName: "GLB"}, ["name", "exportName"]),
		).toBe("GLB");
		expect(
			readStringField({id: "task-uuid-123"}, ["sessionId", "session"]),
		).toBeUndefined();
	});

	it("does not throw when logging ignored slots", () => {
		expect(() =>
			logIgnoredActionSlotEvents(slots, ["click"], "on this node"),
		).not.toThrow();
	});

	it("uses the same UI list for every UI node kind", () => {
		const uiKinds = [
			"widget",
			"tab",
			"container",
			"control",
			"toolbar",
			"viewport",
		] as const;
		for (const kind of uiKinds) {
			expect(APP_BUILDER_SLOT_EVENTS[kind]).toBe(APP_BUILDER_UI_EVENTS);
		}
		expect(APP_BUILDER_SLOT_EVENTS.application).toBe(
			APP_BUILDER_APPLICATION_EVENTS,
		);
		expect(APP_BUILDER_SLOT_EVENTS.root).toEqual([
			...APP_BUILDER_APPLICATION_EVENTS,
			...APP_BUILDER_UI_EVENTS,
		]);
	});
});
