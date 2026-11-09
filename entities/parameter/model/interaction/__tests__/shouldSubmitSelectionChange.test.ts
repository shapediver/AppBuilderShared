import {
	nextActionPendingHold,
	registersPendingSelection,
	shouldSubmitSelectionChange,
} from "../shouldSubmitSelectionChange";

describe("shouldSubmitSelectionChange", () => {
	it("commits an action whose result the parameter accepts", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: true,
				acceptable: true,
				acceptImmediately: false,
				pending: true,
			}),
		).toBe(true);
	});

	it("does not commit an action the parameter would refuse", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: true,
				acceptable: false,
				acceptImmediately: false,
				pending: true,
			}),
		).toBe(false);
	});

	it("leaves a click pending until the selection accepts itself", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: false,
				acceptable: true,
				acceptImmediately: false,
				pending: true,
			}),
		).toBe(false);
	});

	it("commits a click that fills the selection", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: false,
				acceptable: true,
				acceptImmediately: true,
				pending: true,
			}),
		).toBe(true);
	});

	it("does not register an action that is sent on this render", () => {
		expect(
			registersPendingSelection({
				hasPendingSelection: true,
				acceptsAutomatically: false,
				fromAction: true,
				acceptable: true,
				cleared: false,
			}),
		).toBe(false);
	});

	it("registers an action the parameter would refuse", () => {
		expect(
			registersPendingSelection({
				hasPendingSelection: true,
				acceptsAutomatically: false,
				fromAction: true,
				acceptable: false,
				cleared: false,
			}),
		).toBe(true);
	});

	it("registers a click that does not accept itself", () => {
		expect(
			registersPendingSelection({
				hasPendingSelection: true,
				acceptsAutomatically: false,
				fromAction: false,
				acceptable: true,
				cleared: false,
			}),
		).toBe(true);
	});

	it("holds a sent action until the committed value catches up", () => {
		const started = nextActionPendingHold(null, {
			fromAction: true,
			acceptable: true,
			hasPendingSelection: true,
			cleared: false,
			selectionKey: '["box_3"]',
		});
		expect(started).toEqual({heldKey: '["box_3"]', suppress: true});
		expect(
			nextActionPendingHold(started.heldKey, {
				fromAction: false,
				acceptable: true,
				hasPendingSelection: true,
				cleared: false,
				selectionKey: '["box_3"]',
			}),
		).toEqual({heldKey: '["box_3"]', suppress: true});
	});

	it("drops the hold when the draft changes or the value commits", () => {
		expect(
			nextActionPendingHold('["box_3"]', {
				fromAction: false,
				acceptable: true,
				hasPendingSelection: true,
				cleared: false,
				selectionKey: '["box_1"]',
			}),
		).toEqual({heldKey: null, suppress: false});
		expect(
			nextActionPendingHold('["box_3"]', {
				fromAction: false,
				acceptable: true,
				hasPendingSelection: false,
				cleared: false,
				selectionKey: '["box_3"]',
			}),
		).toEqual({heldKey: null, suppress: false});
	});

	it("does not register a selection that accepts itself", () => {
		expect(
			registersPendingSelection({
				hasPendingSelection: true,
				acceptsAutomatically: true,
				fromAction: false,
				acceptable: true,
				cleared: false,
			}),
		).toBe(false);
	});

	it("does not submit a selection equal to the committed value", () => {
		expect(
			shouldSubmitSelectionChange({
				fromAction: true,
				acceptable: true,
				acceptImmediately: true,
				pending: false,
			}),
		).toBe(false);
	});
});
