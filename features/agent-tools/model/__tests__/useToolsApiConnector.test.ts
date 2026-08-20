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
					resolved: resolveToolset(undefined),
					handlers: stubHandlers(),
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
				resolved: resolveToolset(undefined),
				handlers: stubHandlers(),
				snapshotComplete: false,
			}),
		);
		expect(getConnectorApi).not.toHaveBeenCalled();
	});

	it("calls getConnectorApi when window and snapshot are ready", async () => {
		const resolved = resolveToolset(undefined);
		const handlers = stubHandlers();
		const peer = {} as Window;
		renderHook(() =>
			useToolsApiConnector({
				window: peer,
				resolved,
				handlers,
				snapshotComplete: true,
			}),
		);
		await waitFor(() => expect(getConnectorApi).toHaveBeenCalledTimes(1));
		expect(getConnectorApi.mock.calls[0][0]).toBe(peer);
		expect(getConnectorApi.mock.calls[0][1].map((t: {name: string}) => t.name)).toEqual(
			[...IN_SCOPE_GENERIC_TOOL_NAMES],
		);
		expect(getConnectorApi.mock.calls[0][2]).toBe(handlers);
	});
});
