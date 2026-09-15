/**
 * @jest-environment jsdom
 */
import {createRequestEventBus} from "../requestEvents";

describe("createRequestEventBus", () => {
	it("emits start and end around a successful request", async () => {
		const bus = createRequestEventBus<{id: string}>();
		const phases: string[] = [];
		const unsubscribe = bus.addListener((event) => {
			phases.push(event.phase);
			expect(event.id).toBe("a");
		});

		await expect(bus.wrap({id: "a"}, async () => "ok")).resolves.toBe("ok");
		expect(phases).toEqual(["start", "end"]);
		unsubscribe();
	});

	it("emits start and error when the request throws", async () => {
		const bus = createRequestEventBus<{id: string}>();
		const phases: string[] = [];
		const unsubscribe = bus.addListener((event) => {
			phases.push(event.phase);
		});

		await expect(
			bus.wrap({id: "a"}, async () => {
				throw new Error("fail");
			}),
		).rejects.toThrow("fail");
		expect(phases).toEqual(["start", "error"]);
		unsubscribe();
	});
});
