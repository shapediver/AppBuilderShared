import {
	ParameterChangeScheduler,
	ScheduledParameterChanges,
} from "../parameterChangeScheduler";

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));

describe("ParameterChangeScheduler", () => {
	/** Values of the requests, the sender takes the pending changes like the store. */
	let flush: jest.Mock;
	let scheduler: ParameterChangeScheduler;

	const createScheduler = (releaseTarget?: EventTarget) => {
		const created: ParameterChangeScheduler = new ParameterChangeScheduler(
			async () => {
				const {state} = created.take().mergeInto({});
				await flush(state);
			},
			releaseTarget,
		);
		return created;
	};

	beforeEach(() => {
		jest.useFakeTimers();
		flush = jest.fn().mockResolvedValue(undefined);
		scheduler = createScheduler();
	});

	afterEach(() => {
		scheduler.reset();
		jest.useRealTimers();
	});

	const schedule = (parameterId: string, value: string, timeout: number) =>
		scheduler.schedule({
			namespace: "s_appbuilder",
			parameterId,
			value,
			timeout,
		});

	it("sends a value after its timeout", async () => {
		schedule("A", "a1", 500);
		expect(scheduler.isPending("s_appbuilder", "A")).toBe(true);
		jest.advanceTimersByTime(499);
		expect(flush).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		expect(flush).toHaveBeenCalledWith({s_appbuilder: {A: "a1"}});
		expect(scheduler.size).toBe(0);
	});

	it("sends the values of several parameters at once", () => {
		schedule("A", "a1", 500);
		jest.advanceTimersByTime(300);
		schedule("B", "b1", 500);
		jest.advanceTimersByTime(499);
		expect(flush).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		expect(flush).toHaveBeenCalledTimes(1);
		expect(flush).toHaveBeenCalledWith({
			s_appbuilder: {A: "a1", B: "b1"},
		});
	});

	it("restarts the countdown with the longest pending timeout", () => {
		schedule("A", "a1", 3000);
		jest.advanceTimersByTime(2000);
		// the shorter timeout of B does not shorten the wait
		schedule("B", "b1", 500);
		jest.advanceTimersByTime(2999);
		expect(flush).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		expect(flush).toHaveBeenCalledTimes(1);
	});

	it("sends all pending values right away for a timeout of 0", () => {
		schedule("A", "a1", 3000);
		schedule("B", "b1", 0);
		// (the fake timers queue the microtasks)
		jest.runAllTicks();
		expect(flush).toHaveBeenCalledTimes(1);
		expect(flush).toHaveBeenCalledWith({
			s_appbuilder: {A: "a1", B: "b1"},
		});
		jest.advanceTimersByTime(3000);
		expect(flush).toHaveBeenCalledTimes(1);
	});

	it("sends the values with a timeout of 0 of the same task in one request", () => {
		schedule("A", "a1", 0);
		schedule("B", "b1", 0);
		// a value with a timeout of its own scheduled meanwhile goes along
		schedule("C", "c1", 3000);
		// (the fake timers queue the microtasks)
		jest.runAllTicks();
		expect(flush).toHaveBeenCalledTimes(1);
		expect(flush).toHaveBeenCalledWith({
			s_appbuilder: {A: "a1", B: "b1", C: "c1"},
		});
		jest.advanceTimersByTime(3000);
		expect(flush).toHaveBeenCalledTimes(1);
	});

	it("sends right away for a timeout of 0 while a pointer is pressed", () => {
		scheduler.holdPointer(1);
		schedule("A", "a1", 0);
		// (the fake timers queue the microtasks)
		jest.runAllTicks();
		expect(flush).toHaveBeenCalledTimes(1);
	});

	it("notifies the listeners of changes of the pending values", () => {
		const listener = jest.fn();
		const unsubscribe = scheduler.subscribe(listener);
		schedule("A", "a1", 500);
		expect(listener).toHaveBeenCalledTimes(1);
		expect(scheduler.hasPendingIn(["s_appbuilder"])).toBe(true);
		expect(scheduler.hasPendingIn(["s"])).toBe(false);
		scheduler.cancel("s_appbuilder", "B");
		expect(listener).toHaveBeenCalledTimes(1);
		jest.advanceTimersByTime(500);
		// the values were taken to be sent
		expect(listener).toHaveBeenCalledTimes(2);
		expect(scheduler.hasPendingIn(["s_appbuilder"])).toBe(false);
		unsubscribe();
		schedule("A", "a2", 500);
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("replaces the pending value of a parameter", () => {
		schedule("A", "a1", 500);
		schedule("A", "a2", 500);
		jest.advanceTimersByTime(500);
		expect(flush).toHaveBeenCalledWith({s_appbuilder: {A: "a2"}});
	});

	it("cancels the value of one parameter only", () => {
		schedule("A", "a1", 500);
		schedule("B", "b1", 500);
		scheduler.cancel("s_appbuilder", "A");
		expect(scheduler.isPending("s_appbuilder", "A")).toBe(false);
		jest.advanceTimersByTime(500);
		expect(flush).toHaveBeenCalledWith({s_appbuilder: {B: "b1"}});
	});

	it("stops the countdown when nothing is pending", () => {
		schedule("A", "a1", 500);
		scheduler.cancel("s_appbuilder", "A");
		jest.advanceTimersByTime(500);
		expect(flush).not.toHaveBeenCalled();
	});

	it("pauses the countdown while a pointer is pressed", () => {
		schedule("A", "a1", 3000);
		jest.advanceTimersByTime(2000);
		// a new move starts: the earlier value must not be sent during it
		scheduler.holdPointer(1);
		jest.advanceTimersByTime(5000);
		expect(flush).not.toHaveBeenCalled();
		// the move ends: the countdown restarts with the full timeout
		scheduler.releasePointer(1);
		jest.advanceTimersByTime(2999);
		expect(flush).not.toHaveBeenCalled();
		jest.advanceTimersByTime(1);
		expect(flush).toHaveBeenCalledTimes(1);
	});

	it("starts no countdown for a value scheduled while a pointer is pressed", () => {
		scheduler.holdPointer(1);
		schedule("A", "a1", 500);
		schedule("B", "b1", 500);
		jest.advanceTimersByTime(1000);
		expect(flush).not.toHaveBeenCalled();
		scheduler.releasePointer(1);
		jest.advanceTimersByTime(500);
		expect(flush).toHaveBeenCalledWith({s_appbuilder: {A: "a1", B: "b1"}});
	});

	it("waits for the release of all pressed pointers", () => {
		schedule("A", "a1", 500);
		scheduler.holdPointer(1);
		scheduler.holdPointer(2);
		scheduler.releasePointer(1);
		jest.advanceTimersByTime(1000);
		expect(flush).not.toHaveBeenCalled();
		scheduler.releasePointer(2);
		jest.advanceTimersByTime(500);
		expect(flush).toHaveBeenCalledTimes(1);
	});

	it("ignores the release of a pointer which was not pressed", () => {
		schedule("A", "a1", 500);
		jest.advanceTimersByTime(300);
		scheduler.releasePointer(7);
		jest.advanceTimersByTime(200);
		expect(flush).toHaveBeenCalledTimes(1);
	});

	it("releases all pointers at once", () => {
		schedule("A", "a1", 500);
		scheduler.holdPointer(1);
		scheduler.releaseAllPointers();
		jest.advanceTimersByTime(500);
		expect(flush).toHaveBeenCalledTimes(1);
	});

	describe("observes the release of held pointers", () => {
		let target: EventTarget;
		let observed: ParameterChangeScheduler;

		const release = (type: string, pointerId: number) =>
			target.dispatchEvent(Object.assign(new Event(type), {pointerId}));

		beforeEach(() => {
			target = new EventTarget();
			observed = createScheduler(target);
		});

		afterEach(() => observed.reset());

		it("restarts the countdown on pointerup", () => {
			// the press closed the container: no component reports the release
			observed.schedule({
				namespace: "s_appbuilder",
				parameterId: "A",
				value: "a1",
				timeout: 500,
			});
			observed.holdPointer(1);
			jest.advanceTimersByTime(1000);
			expect(flush).not.toHaveBeenCalled();
			release("pointerup", 1);
			jest.advanceTimersByTime(500);
			expect(flush).toHaveBeenCalledWith({s_appbuilder: {A: "a1"}});
		});

		it("restarts the countdown on pointercancel and blur", async () => {
			observed.schedule({
				namespace: "s_appbuilder",
				parameterId: "A",
				value: "a1",
				timeout: 500,
			});
			observed.holdPointer(1);
			release("pointercancel", 1);
			jest.advanceTimersByTime(500);
			expect(flush).toHaveBeenCalledTimes(1);

			observed.schedule({
				namespace: "s_appbuilder",
				parameterId: "A",
				value: "a2",
				timeout: 500,
			});
			observed.holdPointer(2);
			target.dispatchEvent(new Event("blur"));
			jest.advanceTimersByTime(500);
			expect(flush).toHaveBeenCalledTimes(2);
		});

		it("stops observing once no pointer is held", () => {
			observed.holdPointer(1);
			release("pointerup", 1);
			observed.schedule({
				namespace: "s_appbuilder",
				parameterId: "A",
				value: "a1",
				timeout: 500,
			});
			const releasePointer = jest.spyOn(observed, "releasePointer");
			release("pointerup", 1);
			expect(releasePointer).not.toHaveBeenCalled();
		});
	});

	it("groups the values by namespace", () => {
		schedule("A", "a1", 500);
		scheduler.schedule({
			namespace: "other",
			parameterId: "C",
			value: "c1",
			timeout: 500,
		});
		jest.advanceTimersByTime(500);
		expect(flush).toHaveBeenCalledWith({
			s_appbuilder: {A: "a1"},
			other: {C: "c1"},
		});
	});

	it("takes the pending values to send them with another request", () => {
		schedule("A", "a1", 500);
		const taken = scheduler.take();
		expect(scheduler.size).toBe(0);
		expect(taken.mergeInto({}).state).toEqual({s_appbuilder: {A: "a1"}});
		// the countdown stopped
		jest.advanceTimersByTime(500);
		expect(flush).not.toHaveBeenCalled();
	});

	it("discards the pending values", () => {
		const onDiscard = jest.fn();
		const onSent = jest.fn();
		scheduler.schedule({
			namespace: "s_appbuilder",
			parameterId: "A",
			value: "a1",
			timeout: 500,
			onDiscard,
			onSent,
		});
		scheduler.discard();
		expect(onDiscard).toHaveBeenCalledTimes(1);
		expect(scheduler.size).toBe(0);
		jest.advanceTimersByTime(500);
		expect(flush).not.toHaveBeenCalled();
		expect(onSent).not.toHaveBeenCalled();
	});

	it("discards the pending values of some namespaces only", () => {
		const onDiscard = jest.fn();
		schedule("A", "a1", 500);
		scheduler.schedule({
			namespace: "other",
			parameterId: "C",
			value: "c1",
			timeout: 500,
			onDiscard,
		});
		scheduler.discard(["other"]);
		expect(onDiscard).toHaveBeenCalledTimes(1);
		expect(scheduler.isPending("other", "C")).toBe(false);
		// the countdown of the other values goes on
		jest.advanceTimersByTime(500);
		expect(flush).toHaveBeenCalledWith({s_appbuilder: {A: "a1"}});
	});

	it("provides the pending value of a parameter", () => {
		expect(scheduler.pendingValue("s_appbuilder", "A")).toBeUndefined();
		schedule("A", "a1", 500);
		expect(scheduler.pendingValue("s_appbuilder", "A")).toBe("a1");
	});

	it("flushes on demand and logs a failed send", async () => {
		flush.mockRejectedValueOnce(new Error("failed"));
		schedule("A", "a1", 500);
		await expect(scheduler.flush()).resolves.toBeUndefined();
		expect(scheduler.size).toBe(0);
		jest.advanceTimersByTime(500);
		expect(flush).toHaveBeenCalledTimes(1);
	});
});

describe("ScheduledParameterChanges", () => {
	it("merges the values into a request, the values of the request win", () => {
		const changes = new ScheduledParameterChanges([
			{namespace: "a", parameterId: "x", value: "pending", timeout: 0},
			{namespace: "a", parameterId: "y", value: "y1", timeout: 0},
			{
				namespace: "b",
				parameterId: "z",
				value: "z1",
				timeout: 0,
				forceSameValue: true,
			},
		]);
		const {state, forceSameValue, included, overridden} = changes.mergeInto(
			{a: {x: "requested"}, c: {w: "w1"}},
			{c: ["w"]},
		);
		expect(state).toEqual({
			a: {x: "requested", y: "y1"},
			b: {z: "z1"},
			c: {w: "w1"},
		});
		expect(forceSameValue).toEqual({b: ["z"], c: ["w"]});
		// the overridden change is not sent
		expect(included.changes.map((c) => c.parameterId)).toEqual(["y", "z"]);
		expect(overridden.map((c) => c.parameterId)).toEqual(["x"]);
	});

	it("runs the callbacks along the request", async () => {
		const order: string[] = [];
		let endRequest: () => void = () => {};
		const request = new Promise<void>((resolve) => {
			endRequest = () => {
				order.push("request ended");
				resolve();
			};
		});
		const changes = new ScheduledParameterChanges([
			{
				namespace: "a",
				parameterId: "x",
				value: "x1",
				timeout: 0,
				onSend: async (value) => {
					order.push(`send ${value}`);
				},
				onSent: () => order.push("sent"),
			},
		]);
		const sent = changes.sendAlong(request);
		// the delegates run together with the request
		expect(order).toEqual(["send x1"]);
		endRequest();
		await sent;
		expect(order).toEqual(["send x1", "request ended", "sent"]);
	});

	it("runs onSent when the request failed", async () => {
		const onSent = jest.fn();
		const changes = new ScheduledParameterChanges([
			{namespace: "a", parameterId: "x", value: "x1", timeout: 0, onSent},
		]);
		await expect(
			changes.sendAlong(Promise.reject(new Error("failed"))),
		).rejects.toThrow("failed");
		expect(onSent).toHaveBeenCalledTimes(1);
	});
});
