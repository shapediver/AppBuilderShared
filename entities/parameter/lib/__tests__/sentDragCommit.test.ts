import {
	consumeSentDrag,
	dropCancelledSends,
	resolveDraggingClearCommit,
	type SentDrag,
} from "../sentDragCommit";
import {SentValues} from "../sentValues";

const entry = (value: string, names: string[]): SentDrag<{name: string}> => ({
	value,
	gestures: names.map((name) => ({name})),
});

describe("consumeSentDrag", () => {
	it("treats an unknown commit as foreign and drops the sent list", () => {
		const sent = new SentValues();
		sent.record("a");
		expect(consumeSentDrag(sent, [entry("a", ["box"])], "other")).toEqual({
			own: false,
			newerPending: false,
			consumedNames: [],
			remaining: [],
		});
	});

	it("returns the objects of an own commit", () => {
		const sent = new SentValues();
		sent.record("v1");
		const result = consumeSentDrag(sent, [entry("v1", ["A"])], "v1");
		expect(result.own).toBe(true);
		expect(result.newerPending).toBe(false);
		expect(result.consumedNames).toEqual(["A"]);
		expect(result.remaining).toEqual([]);
	});

	it("keeps a newer sent drag pending and only names the committed one", () => {
		const sent = new SentValues();
		sent.record("v1");
		sent.record("v2");
		const result = consumeSentDrag(
			sent,
			[entry("v1", ["A"]), entry("v2", ["A", "B"])],
			"v1",
		);
		expect(result.own).toBe(true);
		expect(result.newerPending).toBe(true);
		expect(result.consumedNames).toEqual(["A"]);
		expect(result.remaining).toEqual([entry("v2", ["A", "B"])]);
	});

	it("includes objects from older sends when the newest commit arrives", () => {
		const sent = new SentValues();
		sent.record("v1");
		sent.record("v2");
		const result = consumeSentDrag(
			sent,
			[entry("v1", ["A"]), entry("v2", ["A", "B"])],
			"v2",
		);
		expect(result.newerPending).toBe(false);
		expect(result.consumedNames).toEqual(["A", "B"]);
		expect(result.remaining).toEqual([]);
	});
});

describe("resolveDraggingClearCommit", () => {
	const base = {
		clearRequested: true,
		resetSent: false,
		own: true,
		newerPending: false,
		commitIsDefault: false,
	};

	it("ignores a commit while no clear is waiting", () => {
		expect(
			resolveDraggingClearCommit({...base, clearRequested: false}),
		).toEqual({
			keepClearedScene: false,
			sendReset: false,
			finished: false,
		});
	});

	it("keeps the cleared scene and sends the reset when the drag commits", () => {
		expect(resolveDraggingClearCommit(base)).toEqual({
			keepClearedScene: true,
			sendReset: true,
			finished: false,
		});
	});

	it("waits for a newer sent drag before sending the reset", () => {
		expect(
			resolveDraggingClearCommit({...base, newerPending: true}),
		).toEqual({
			keepClearedScene: true,
			sendReset: false,
			finished: false,
		});
	});

	it("does not send the reset twice", () => {
		expect(resolveDraggingClearCommit({...base, resetSent: true})).toEqual({
			keepClearedScene: true,
			sendReset: false,
			finished: false,
		});
	});

	it("finishes when the drag commit is already the default", () => {
		expect(
			resolveDraggingClearCommit({...base, commitIsDefault: true}),
		).toEqual({
			keepClearedScene: true,
			sendReset: false,
			finished: true,
		});
	});

	it("applies a foreign commit, which is the reset or an undo", () => {
		expect(resolveDraggingClearCommit({...base, own: false})).toEqual({
			keepClearedScene: false,
			sendReset: false,
			finished: true,
		});
	});
});

describe("dropCancelledSends", () => {
	it("drops the cancelled send and keeps an earlier one already in flight", () => {
		const sent = new SentValues();
		sent.record("v1");
		sent.record("v1");
		const remaining = dropCancelledSends(
			sent,
			[entry("v1", ["A"]), entry("v1", ["A", "B"])],
			["v1"],
		);
		expect(remaining).toEqual([entry("v1", ["A"])]);
		expect(sent.takeCommit("v1")).toEqual({
			own: true,
			newerPending: false,
		});
	});
});
