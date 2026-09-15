import {
	addExportRequestListener,
	withExportRequestEvents,
} from "../exportRequestEvents";

describe("exportRequestEvents", () => {
	it("emits start and end around a successful request", async () => {
		const phases: string[] = [];
		const unsubscribe = addExportRequestListener((event) => {
			phases.push(event.phase);
			expect(event.sessionId).toBe("controller");
			expect(event.name).toBe("GLB");
		});

		await expect(
			withExportRequestEvents(
				{sessionId: "controller", name: "GLB"},
				async () => "ok",
			),
		).resolves.toBe("ok");

		expect(phases).toEqual(["start", "end"]);
		unsubscribe();
	});

	it("emits start and error when the request throws", async () => {
		const phases: string[] = [];
		const unsubscribe = addExportRequestListener((event) => {
			phases.push(event.phase);
		});

		await expect(
			withExportRequestEvents({sessionId: "controller"}, async () => {
				throw new Error("fail");
			}),
		).rejects.toThrow("fail");

		expect(phases).toEqual(["start", "error"]);
		unsubscribe();
	});
});
