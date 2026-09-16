/**
 * @jest-environment jsdom
 */

import type {IAppBuilderActionSlots} from "../../config/appbuilderActionSlots";
import {
	APP_BUILDER_APPLICATION_EVENTS,
	APP_BUILDER_INTERACTION_EVENTS,
	APP_BUILDER_SLOT_EVENTS,
	APP_BUILDER_UI_EVENTS,
	APP_BUILDER_UI_EVENT_REACT_PROPS,
	isAppBuilderApplicationEvent,
	isAppBuilderInteractionEvent,
	logIgnoredActionSlotEvents,
	mapViewerInteractionEventToSlot,
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
					index: 0,
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

	it("recognizes application and viewer interaction event names", () => {
		expect(isAppBuilderApplicationEvent("selecton")).toBe(true);
		expect(isAppBuilderInteractionEvent("hoveroff")).toBe(true);
		expect(isAppBuilderApplicationEvent("interaction.select.on")).toBe(
			false,
		);
		expect(isAppBuilderApplicationEvent("selectionchange")).toBe(false);
		expect(isAppBuilderApplicationEvent("click")).toBe(false);
		expect(APP_BUILDER_APPLICATION_EVENTS).toEqual(
			expect.arrayContaining([...APP_BUILDER_INTERACTION_EVENTS]),
		);
	});

	it("maps viewer interaction events onto selecton/selectoff/hoveron/hoveroff", () => {
		expect(mapViewerInteractionEventToSlot("interaction.select.on")).toBe(
			"selecton",
		);
		expect(
			mapViewerInteractionEventToSlot("interaction.multiSelect.on"),
		).toBe("selecton");
		expect(mapViewerInteractionEventToSlot("interaction.select.off")).toBe(
			"selectoff",
		);
		expect(
			mapViewerInteractionEventToSlot("interaction.select.off", {
				reselection: true,
			}),
		).toBeUndefined();
		expect(
			mapViewerInteractionEventToSlot("interaction.multiSelect.off"),
		).toBe("selectoff");
		expect(mapViewerInteractionEventToSlot("interaction.hover.on")).toBe(
			"hoveron",
		);
		expect(mapViewerInteractionEventToSlot("interaction.hover.off")).toBe(
			"hoveroff",
		);
		expect(
			mapViewerInteractionEventToSlot(
				"interaction.multiSelect.maximumNodes",
			),
		).toBeUndefined();
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

	it("flattens an array of slots for one event name", () => {
		const first = {
			action: {type: "undo" as const, props: {}},
			eventProps: {
				type: "selection" as const,
				props: {nameFilter: ["A"]},
			},
		};
		const second = {
			action: {type: "redo" as const, props: {}},
			eventProps: {
				type: "selection" as const,
				props: {nameFilter: ["B"]},
			},
		};
		expect(
			pickAllowedActionSlots(
				{selecton: [first, second]},
				APP_BUILDER_SLOT_EVENTS.application,
			),
		).toEqual([
			{eventName: "selecton", slot: first, index: 0},
			{eventName: "selecton", slot: second, index: 1},
		]);
	});
});
