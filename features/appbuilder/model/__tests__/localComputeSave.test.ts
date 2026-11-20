import {
	isLocalComputeModelViewUrl,
	localComputeSaveShouldReload,
	openLocalComputeSaveConnection,
	resolveLocalComputeSession,
	retainLocalComputeSaveConnection,
	type LocalComputeSaveSource,
} from "../localComputeSave";

class FakeSource implements LocalComputeSaveSource {
	closed = false;
	readonly listeners: {[name: string]: Array<() => void>} = {};

	addEventListener(type: string, listener: () => void): void {
		this.listeners[type] = this.listeners[type] ?? [];
		this.listeners[type].push(listener);
	}

	emit(type: string): void {
		(this.listeners[type] ?? []).forEach((listener) => listener());
	}

	close(): void {
		this.closed = true;
	}
}

describe("local Grasshopper save reload", () => {
	it("reloads a localhost session when that server sends the save event", () => {
		const source = new FakeSource();
		let reloaded = 0;
		openLocalComputeSaveConnection(
			"http://127.0.0.1:8765",
			() => {
				reloaded += 1;
			},
			() => source,
		);

		source.emit("save");
		expect(reloaded).toBe(1);
	});

	it("does not reload on an edit event", () => {
		const source = new FakeSource();
		let reloaded = 0;
		openLocalComputeSaveConnection(
			"http://127.0.0.1:8765",
			() => {
				reloaded += 1;
			},
			() => source,
		);

		source.emit("edit");
		expect(reloaded).toBe(0);
	});

	it("does not treat a Cloudflare quick tunnel as local", () => {
		let opened = 0;
		const connection = openLocalComputeSaveConnection(
			"https://example.trycloudflare.com",
			() => {
				throw new Error("A tunnel address must not reload.");
			},
			() => {
				opened += 1;
				return new FakeSource();
			},
		);

		expect(opened).toBe(0);
		expect(
			isLocalComputeModelViewUrl("https://example.trycloudflare.com"),
		).toBe(false);
		connection.close();
	});

	it("never connects for a ShapeDiver host", () => {
		let opened = 0;
		const connection = openLocalComputeSaveConnection(
			"https://sdeuc1.eu-central-1.shapediver.com",
			() => {
				throw new Error("A ShapeDiver host must not reload.");
			},
			() => {
				opened += 1;
				return new FakeSource();
			},
		);

		expect(opened).toBe(0);
		expect(isLocalComputeModelViewUrl("https://www.shapediver.com")).toBe(
			false,
		);
		connection.close();
	});

	it("opens one save stream when two callers name the same server", () => {
		const source = new FakeSource();
		let opened = 0;
		const open = () => {
			opened += 1;
			return source;
		};
		const first = retainLocalComputeSaveConnection(
			"http://127.0.0.1:8765/ticket/a",
			() => undefined,
			open,
		);
		const second = retainLocalComputeSaveConnection(
			"http://127.0.0.1:8765/api/v2/ticket/b",
			() => undefined,
			open,
		);

		expect(opened).toBe(1);
		first.release();
		expect(source.closed).toBe(false);
		second.release();
		expect(source.closed).toBe(true);
	});

	it("opens a separate save stream per port", () => {
		let opened = 0;
		const open = () => {
			opened += 1;
			return new FakeSource();
		};
		const first = retainLocalComputeSaveConnection(
			"http://127.0.0.1:8765",
			() => undefined,
			open,
		);
		const second = retainLocalComputeSaveConnection(
			"http://127.0.0.1:8766",
			() => undefined,
			open,
		);

		expect(opened).toBe(2);
		first.release();
		second.release();
	});

	it("does not reload a session whose port is different from the save event", () => {
		expect(
			localComputeSaveShouldReload(
				"http://127.0.0.1:8765",
				"http://127.0.0.1:8766/api/v2/events",
				"save",
			),
		).toBe(false);
		expect(
			localComputeSaveShouldReload(
				"http://127.0.0.1:8765",
				"http://127.0.0.1:8765/api/v2/events",
				"save",
			),
		).toBe(true);
	});
});

describe("resolveLocalComputeSession", () => {
	const controller = {modelViewUrl: "http://127.0.0.1:5001/", ticket: "t1"};
	const response = (status: number, body: unknown) =>
		({
			ok: status >= 200 && status < 300,
			status,
			json: async () => body,
		}) as Response;

	it("asks the local controller with its ticket and returns the other document", async () => {
		const fetchImpl = jest.fn(async () =>
			response(200, {
				slug: "chair",
				ticket: "t2",
				modelViewUrl: "http://127.0.0.1:5002",
			}),
		);
		await expect(
			resolveLocalComputeSession(controller, "chair x", fetchImpl),
		).resolves.toEqual({
			ticket: "t2",
			modelViewUrl: "http://127.0.0.1:5002",
		});
		expect(fetchImpl).toHaveBeenCalledWith(
			"http://127.0.0.1:5001/api/v2/local/resolve?slug=chair+x",
			expect.objectContaining({headers: {Authorization: "Bearer t1"}}),
		);
	});

	it("does not call a controller on another host, or without a ticket", async () => {
		const fetchImpl = jest.fn();
		await expect(
			resolveLocalComputeSession(
				{
					modelViewUrl:
						"https://sdr8euc1.eu-central-1.shapediver.com",
					ticket: "t1",
				},
				"chair",
				fetchImpl,
			),
		).resolves.toBeUndefined();
		await expect(
			resolveLocalComputeSession(
				{modelViewUrl: controller.modelViewUrl},
				"chair",
				fetchImpl,
			),
		).resolves.toBeUndefined();
		expect(fetchImpl).not.toHaveBeenCalled();
	});

	it.each([
		["404", async () => response(404, {error: "SdNotFoundError"})],
		["401", async () => response(401, {error: "SdErrorUnauthorized"})],
		["a body without a ticket", async () => response(200, {slug: "chair"})],
		[
			"a network error",
			async () => {
				throw new TypeError("Failed to fetch");
			},
		],
	])("returns undefined on %s", async (_, impl) => {
		await expect(
			resolveLocalComputeSession(controller, "chair", jest.fn(impl)),
		).resolves.toBeUndefined();
	});

	it("gives up after the timeout", async () => {
		const fetchImpl = jest.fn(
			(_url: string, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener("abort", () =>
						reject(new Error("aborted")),
					);
				}),
		);
		await expect(
			resolveLocalComputeSession(
				controller,
				"chair",
				fetchImpl as unknown as typeof fetch,
				10,
			),
		).resolves.toBeUndefined();
	});
});
