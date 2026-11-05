import {consumeSentDrag, type SentDrag} from "../sentDragCommit";
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
