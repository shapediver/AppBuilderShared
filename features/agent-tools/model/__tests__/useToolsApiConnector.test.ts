/**
 * @jest-environment jsdom
 */

const getConnectorApi = jest.fn();

jest.mock("../../api/toolsApiConnector", () => ({
	ToolsApiConnectorFactory: {
		getConnectorApi: (...args: unknown[]) => getConnectorApi(...args),
	},
}));

import {createElement, StrictMode, type ReactNode} from "react";
import {act, renderHook, waitFor} from "@testing-library/react";
import {IN_SCOPE_GENERIC_TOOL_NAMES} from "../../config/inScopeGenericTools";
import type {ExecutableSpecificTool} from "../../config/resolveSpecificTools";
import {resolveToolset} from "../../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../../config/toolsApiConnector";
import {useToolsApiConnector} from "../useToolsApiConnector";

function strictModeWrapper({children}: {children: ReactNode}) {
	return createElement(StrictMode, null, children);
}

function trackUnhandledRejections() {
	const reasons: unknown[] = [];
	const onUnhandled = (reason: unknown) => {
		reasons.push(reason);
	};
	process.on("unhandledRejection", onUnhandled);
	return {
		reasons,
		stop() {
			process.off("unhandledRejection", onUnhandled);
		},
	};
}

/** Connector whose `cancel()` rejects `peerIsReady`, matching `cancelHandshake`. */
function connectorRejectedOnCancel() {
	let rejectReady: (reason?: unknown) => void = () => {};
	const peerIsReady = new Promise<{origin: string; name: string}>(
		(_resolve, reject) => {
			rejectReady = reject;
		},
	);
	const cancel = jest.fn(() => {
		rejectReady(new Error("Handshake cancelled"));
	});
	return {peerIsReady, cancel};
}

async function flushRejections() {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 20));
	});
}

function stubHandlers(): IToolsApiHandlerMap {
	const unused = async () => ({unused: true});
	return {
		list_parameter_definitions: unused,
		get_parameter_values: unused,
		set_parameter_values: unused,
		list_action_controls: unused,
		trigger_action_control: unused,
		set_camera: unused,
		get_camera: unused,
		get_screenshot: unused,
		get_metric: unused,
	};
}

describe("useToolsApiConnector", () => {
	beforeEach(() => {
		getConnectorApi.mockReset();
		getConnectorApi.mockResolvedValue({
			peerIsReady: Promise.resolve({origin: "test", name: "agent"}),
			cancel: jest.fn(),
		});
	});

	it("does not register when window is omitted", () => {
		expect(() => {
			renderHook(() =>
				useToolsApiConnector({
					resolvedGenericTools: resolveToolset(undefined),
					toolHandlers: stubHandlers(),
					snapshotComplete: true,
				}),
			);
		}).not.toThrow();
		expect(getConnectorApi).not.toHaveBeenCalled();
	});

	it("does not register when snapshot is incomplete", () => {
		renderHook(() =>
			useToolsApiConnector({
				window: {} as Window,
				resolvedGenericTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: false,
			}),
		);
		expect(getConnectorApi).not.toHaveBeenCalled();
	});

	it("calls getConnectorApi when window and snapshot are ready", async () => {
		const resolvedGenericTools = resolveToolset(undefined);
		const toolHandlers = stubHandlers();
		const peer = {} as Window;
		renderHook(() =>
			useToolsApiConnector({
				window: peer,
				resolvedGenericTools,
				toolHandlers,
				snapshotComplete: true,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		expect(getConnectorApi.mock.calls[0][0]).toBe(peer);
		expect(
			getConnectorApi.mock.calls[0][1].map((t: {name: string}) => t.name),
		).toEqual([...IN_SCOPE_GENERIC_TOOL_NAMES]);
		expect(getConnectorApi.mock.calls[0][2]).toBe(toolHandlers);
	});

	it("reports the handshake once the peer is ready", async () => {
		const {result} = renderHook(() =>
			useToolsApiConnector({
				window: {} as Window,
				resolvedGenericTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
			}),
		);
		expect(result.current).toBe(false);
		await waitFor(() => expect(result.current).toBe(true));
	});

	it("passes parameterized Agent config as getConnectorApi 7th argument", async () => {
		const agent = {
			id: "a",
			name: "A",
			message: "hi",
		};
		const peer = {} as Window;
		renderHook(() =>
			useToolsApiConnector({
				window: peer,
				resolvedGenericTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
				agentConfig: agent,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		expect(getConnectorApi.mock.calls[0][6]).toBe(agent);
	});

	it("passes resolvedSpecificTools as getConnectorApi 9th argument", async () => {
		const resolvedSpecificTools: ExecutableSpecificTool[] = [
			{
				name: "set_length",
				description: "Set length",
				inputSchema: {type: "object"},
				action: undefined,
				execute: async () => ({success: true}),
			},
		];
		const peer = {} as Window;
		renderHook(() =>
			useToolsApiConnector({
				window: peer,
				resolvedGenericTools: resolveToolset(undefined),
				resolvedSpecificTools,
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		expect(getConnectorApi.mock.calls[0][8]).toBe(resolvedSpecificTools);
	});

	it("passes AgentUi flags as getConnectorApi 10th and 11th arguments", async () => {
		const peer = {} as Window;
		renderHook(() =>
			useToolsApiConnector({
				window: peer,
				resolvedGenericTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
				showThreadHistory: false,
				createThreadOnLoad: true,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		expect(getConnectorApi.mock.calls[0][9]).toBe(false);
		expect(getConnectorApi.mock.calls[0][10]).toBe(true);
	});

	it("passes sessionInfo as getConnectorApi 8th argument", async () => {
		const sessionInfo = {
			jwtToken: "tok",
			slug: "my-model",
			modelStateId: "ms-1",
		};
		const peer = {} as Window;
		renderHook(() =>
			useToolsApiConnector({
				window: peer,
				resolvedGenericTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
				sessionInfo,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		expect(getConnectorApi.mock.calls[0][7]).toBe(sessionInfo);
	});

	it("cancels on unmount while peerIsReady is still pending", async () => {
		const cancel = jest.fn();
		const peerIsReady = new Promise<{origin: string; name: string}>(() => {
			/* never resolves */
		});
		getConnectorApi.mockResolvedValue({peerIsReady, cancel});
		const {unmount} = renderHook(() =>
			useToolsApiConnector({
				window: {} as Window,
				resolvedGenericTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		unmount();
		expect(cancel).toHaveBeenCalledTimes(1);
	});

	it("swallows peerIsReady rejection without unhandled rejection", async () => {
		const cancel = jest.fn();
		const peerIsReady = Promise.reject(new Error("handshake timeout"));
		getConnectorApi.mockResolvedValue({peerIsReady, cancel});
		renderHook(() =>
			useToolsApiConnector({
				window: {} as Window,
				resolvedGenericTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		await expect(peerIsReady).rejects.toThrow("handshake timeout");
	});

	it("swallows handshake rejection when getConnectorApi settles after unmount", async () => {
		const unhandled = trackUnhandledRejections();
		let resolveConnector: (value: {
			peerIsReady: Promise<{origin: string; name: string}>;
			cancel: () => void;
		}) => void = () => {};
		getConnectorApi.mockReturnValue(
			new Promise((resolve) => {
				resolveConnector = resolve;
			}),
		);
		const {unmount} = renderHook(() =>
			useToolsApiConnector({
				window: {} as Window,
				resolvedGenericTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		unmount();

		const {peerIsReady, cancel} = connectorRejectedOnCancel();
		resolveConnector({peerIsReady, cancel});

		try {
			await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
			await flushRejections();
			expect(unhandled.reasons).toEqual([]);
		} finally {
			unhandled.stop();
		}
	});

	it("swallows handshake rejection when the peer window changes before getConnectorApi settles", async () => {
		const unhandled = trackUnhandledRejections();
		const resolvers: Array<
			(value: {
				peerIsReady: Promise<{origin: string; name: string}>;
				cancel: () => void;
			}) => void
		> = [];
		getConnectorApi.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				}),
		);
		const peerA = {name: "a"} as unknown as Window;
		const peerB = {name: "b"} as unknown as Window;
		const {rerender, result} = renderHook(
			({window}: {window: Window}) =>
				useToolsApiConnector({
					window,
					resolvedGenericTools: resolveToolset(undefined),
					toolHandlers: stubHandlers(),
					snapshotComplete: true,
				}),
			{initialProps: {window: peerA}},
		);
		await waitFor(() => expect(resolvers).toHaveLength(1));
		rerender({window: peerB});
		await waitFor(() => expect(resolvers).toHaveLength(2));

		const {peerIsReady, cancel} = connectorRejectedOnCancel();
		resolvers[0]!({peerIsReady, cancel});

		try {
			await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
			await flushRejections();
			expect(unhandled.reasons).toEqual([]);
			expect(result.current).toBe(false);
		} finally {
			unhandled.stop();
		}
	});

	it("swallows handshake rejection from a Strict Mode effect that was discarded", async () => {
		const unhandled = trackUnhandledRejections();
		const resolvers: Array<
			(value: {
				peerIsReady: Promise<{origin: string; name: string}>;
				cancel: () => void;
			}) => void
		> = [];
		getConnectorApi.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvers.push(resolve);
				}),
		);
		renderHook(
			() =>
				useToolsApiConnector({
					window: {} as Window,
					resolvedGenericTools: resolveToolset(undefined),
					toolHandlers: stubHandlers(),
					snapshotComplete: true,
				}),
			{wrapper: strictModeWrapper},
		);
		await waitFor(() => expect(resolvers.length).toBeGreaterThanOrEqual(1));

		const {peerIsReady, cancel} = connectorRejectedOnCancel();
		resolvers[0]!({peerIsReady, cancel});

		try {
			await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
			await flushRejections();
			expect(unhandled.reasons).toEqual([]);
		} finally {
			unhandled.stop();
		}
	});
});
