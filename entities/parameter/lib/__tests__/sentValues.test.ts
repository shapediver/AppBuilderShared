import {SentValues} from "../sentValues";

describe("SentValues", () => {
	it("treats a commit of the sent value as own", () => {
		const sent = new SentValues();
		sent.record("a");
		expect(sent.takeCommit("a")).toEqual({own: true, newerPending: false});
		// the value is consumed
		expect(sent.takeCommit("a")).toEqual({own: false, newerPending: false});
	});

	it("keeps a newer sent value when an older one commits", () => {
		const sent = new SentValues();
		sent.record("a");
		sent.record("b");
		expect(sent.takeCommit("a")).toEqual({own: true, newerPending: true});
		expect(sent.takeCommit("b")).toEqual({own: true, newerPending: false});
	});

	it("drops older sent values when a newer one commits", () => {
		const sent = new SentValues();
		sent.record("a");
		sent.record("b");
		expect(sent.takeCommit("b")).toEqual({own: true, newerPending: false});
		expect(sent.takeCommit("a")).toEqual({own: false, newerPending: false});
	});

	it("forgets all sent values on a foreign commit", () => {
		const sent = new SentValues();
		sent.record("a");
		sent.record("b");
		expect(sent.takeCommit("reset")).toEqual({
			own: false,
			newerPending: false,
		});
		expect(sent.takeCommit("b")).toEqual({own: false, newerPending: false});
	});

	it("matches a value sent twice in the order of sending", () => {
		const sent = new SentValues();
		sent.record("a");
		sent.record("b");
		sent.record("a");
		// the first commit of "a" is the oldest send, "b" and "a" are newer
		expect(sent.takeCommit("a")).toEqual({own: true, newerPending: true});
		expect(sent.takeCommit("b")).toEqual({own: true, newerPending: true});
		expect(sent.takeCommit("a")).toEqual({own: true, newerPending: false});
	});

	it("tells a superseded own value", () => {
		const sent = new SentValues();
		sent.record("a");
		sent.record("b");
		expect(sent.isSuperseded("a")).toBe(true);
		expect(sent.isSuperseded("b")).toBe(false);
		expect(sent.isSuperseded("foreign")).toBe(false);
		sent.takeCommit("a");
		expect(sent.isSuperseded("b")).toBe(false);
	});

	it("forgets all sent values on clear", () => {
		const sent = new SentValues();
		sent.record("a");
		sent.clear();
		expect(sent.takeCommit("a")).toEqual({own: false, newerPending: false});
	});
});
