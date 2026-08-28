/**
 * @jest-environment node
 */

type Handler = (event: {
	source: object;
	origin: string;
	data: unknown;
}) => Promise<unknown>;

const mockListeners = new Map<string, Handler>();
const mockSends: Array<{name: string; timeout?: number}> = [];

jest.mock("post-robot", () => ({
	__esModule: true,
	default: {
		send: async (
			_window: object,
			name: string,
			data: unknown,
			options?: {timeout?: number},
		) => {
			mockSends.push({name, timeout: options?.timeout});
			const handler = mockListeners.get(name);
			if (!handler) {
				throw new Error(`no listener for ${name}`);
			}
			const result = await handler({
				source: {},
				origin: "http://localhost:3001",
				data,
			});
			return {data: result};
		},
		on: (
			name: string,
			optsOrWindow: {handler?: Handler; window?: object} | object,
			maybeHandler?: Handler,
		) => {
			const handler =
				maybeHandler ?? (optsOrWindow as {handler: Handler}).handler;
			mockListeners.set(name, handler);
			return {
				cancel: () => {
					mockListeners.delete(name);
				},
			};
		},
	},
}));

import type {ICrossWindowApi} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import {CrossWindowApiFactory} from "../crosswindowapi";

const HANDSHAKE_TYPE = "TOOLS_API_HANDSHAKE";

async function createPeerApis(): Promise<{
	appApi: ICrossWindowApi;
	agentApi: ICrossWindowApi;
}> {
	const iframe = {id: "iframe"};
	const parent = {id: "parent"};

	const [appApi, agentApi] = await Promise.all([
		CrossWindowApiFactory.getWindowApi(
			iframe as unknown as Window,
			"app",
			"agent",
			{timeout: 2000},
		),
		CrossWindowApiFactory.getWindowApi(
			parent as unknown as Window,
			"agent",
			"app",
			{timeout: 2000},
		),
	]);

	return {appApi, agentApi};
}

describe("CrossWindowApi handshake", () => {
	let appApi: ICrossWindowApi | undefined;
	let agentApi: ICrossWindowApi | undefined;

	beforeEach(() => {
		mockListeners.clear();
		mockSends.length = 0;
	});

	afterEach(() => {
		appApi?.cancelHandshake();
		agentApi?.cancelHandshake();
		appApi = undefined;
		agentApi = undefined;
		jest.useRealTimers();
		mockListeners.clear();
	});

	it("plants API_READY with options.timeout so post-robot onChildWindowReady is not poisoned at 100ms", async () => {
		({appApi, agentApi} = await createPeerApis());
		const readyPings = mockSends.filter((s) => s.name.endsWith("API_READY"));
		expect(readyPings.length).toBeGreaterThan(0);
		expect(readyPings.some((s) => s.timeout === 2000)).toBe(true);
	});

	it("resolves handshake() when send of the handshake type succeeds, without waiting for receive", async () => {
		({appApi, agentApi} = await createPeerApis());
		agentApi.on(HANDSHAKE_TYPE, async () => undefined);

		await expect(
			appApi.handshake(HANDSHAKE_TYPE, 1500),
		).resolves.toMatchObject({name: "agent"});
	});

	it("resolves handshake() when the peer sends first (receive path)", async () => {
		({appApi, agentApi} = await createPeerApis());

		const handshake = appApi.handshake(HANDSHAKE_TYPE, 1500);
		await agentApi.send(HANDSHAKE_TYPE, undefined);

		await expect(handshake).resolves.toMatchObject({name: "agent"});
	});

	it("completes on both sides when the second peer starts after the first send", async () => {
		({appApi, agentApi} = await createPeerApis());

		const agentHandshake = agentApi.handshake(HANDSHAKE_TYPE, 1500);
		await new Promise((resolve) => setTimeout(resolve, 50));
		const appHandshake = appApi.handshake(HANDSHAKE_TYPE, 1500);

		await expect(
			Promise.all([appHandshake, agentHandshake]),
		).resolves.toHaveLength(2);
	});

	it("rejects with the exact timeout message when neither send nor receive succeeds", async () => {
		({appApi, agentApi} = await createPeerApis());
		jest.useFakeTimers();

		const handshake = appApi.handshake(HANDSHAKE_TYPE, 20000);
		const assertion = expect(handshake).rejects.toThrow(
			'Peer did not respond to handshake "TOOLS_API_HANDSHAKE" within 20000ms, giving up',
		);
		await jest.advanceTimersByTimeAsync(20000);
		await assertion;
	});
});
