import {AutomaticSceneUpdateScheduler} from "../automaticSceneUpdateScheduler";

jest.mock("@AppBuilderLib/shared/lib/logger", () => ({
	Logger: {warn: jest.fn()},
}));
jest.mock("../useShapeDiverStoreParameters", () => ({
	useShapeDiverStoreParameters: {
		getState: () => ({batchParameterValueUpdate: jest.fn()}),
	},
}));

describe("AutomaticSceneUpdateScheduler", () => {
	let flush: jest.Mock;
	let scheduler: AutomaticSceneUpdateScheduler;

	beforeEach(() => {
		jest.useFakeTimers();
		flush = jest.fn().mockResolvedValue(undefined);
		scheduler = new AutomaticSceneUpdateScheduler(flush);
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

	it("runs the afterSend callbacks once the values were sent", async () => {
		const afterSend = jest.fn().mockResolvedValue(undefined);
		scheduler.schedule({
			namespace: "s_appbuilder",
			parameterId: "A",
			value: "a1",
			timeout: 0,
			afterSend,
		});
		await scheduler.flush();
		expect(flush).toHaveBeenCalledTimes(1);
		expect(afterSend).toHaveBeenCalledWith("a1");
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
