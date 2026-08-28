/**
 * @jest-environment jsdom
 */

const getConnectorApi = jest.fn();

jest.mock("../../api/toolsApi", () => ({
	ToolsApiFactory: {
		getConnectorApi: (...args: unknown[]) => getConnectorApi(...args),
	},
}));

import {renderHook, waitFor} from "@testing-library/react";
import {IN_SCOPE_GENERIC_TOOL_NAMES} from "../../config/inScopeGenericTools";
import {resolveToolset} from "../../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../../config/toolsApi";
import {useToolsApiConnector} from "../useToolsApiConnector";

function stubHandlers(): IToolsApiHandlerMap {
	const unused = async () => ({unused: true});
	return {
		list_parameter_definitions: unused,
		get_parameter_values: unused,
		set_parameter_values: unused,
		list_action_controls: unused,
		trigger_action_control: unused,
		set_camera_position: unused,
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
					resolvedTools: resolveToolset(undefined),
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
				resolvedTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: false,
			}),
		);
		expect(getConnectorApi).not.toHaveBeenCalled();
	});

	it("calls getConnectorApi when window and snapshot are ready", async () => {
		const resolvedTools = resolveToolset(undefined);
		const toolHandlers = stubHandlers();
		const peer = {} as Window;
		renderHook(() =>
			useToolsApiConnector({
				window: peer,
				resolvedTools,
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

	it("passes parameterized Agent config as getConnectorApi last argument", async () => {
		const agent = {
			id: "a",
			name: "A",
			message: "hi",
		};
		const peer = {} as Window;
		renderHook(() =>
			useToolsApiConnector({
				window: peer,
				resolvedTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
				agentConfig: agent,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		expect(getConnectorApi.mock.calls[0][6]).toBe(agent);
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
				resolvedTools: resolveToolset(undefined),
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
				resolvedTools: resolveToolset(undefined),
				toolHandlers: stubHandlers(),
				snapshotComplete: true,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		await expect(peerIsReady).rejects.toThrow("handshake timeout");
	});
});
