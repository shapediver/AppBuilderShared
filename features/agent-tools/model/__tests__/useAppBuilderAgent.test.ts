/**
 * @jest-environment jsdom
 */

const useAgentToolRuntime = jest.fn();
const useWebMcpTools = jest.fn();
const useToolsApiConnector = jest.fn();

jest.mock("../useAgentToolRuntime", () => ({
	useAgentToolRuntime: (...args: unknown[]) => useAgentToolRuntime(...args),
}));

jest.mock("@AppBuilderLib/features/webmcp/model/useWebMcpTools", () => ({
	useWebMcpTools: (...args: unknown[]) => useWebMcpTools(...args),
}));

jest.mock("@AppBuilderLib/features/webmcp/lib/webmcpAvailability", () => ({
	isWebMcpAvailable: () => true,
}));

jest.mock("../useToolsApiConnector", () => ({
	useToolsApiConnector: (...args: unknown[]) =>
		useToolsApiConnector(...args),
}));

import {act, renderHook} from "@testing-library/react";
import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {useAppBuilderAgent} from "../useAppBuilderAgent";

const runtime = {
	resolvedTools: [],
	toolHandlers: {},
	snapshotComplete: true,
};

describe("useAppBuilderAgent", () => {
	beforeEach(() => {
		window.history.replaceState({}, "", "/");
		useAgentToolRuntime.mockReset().mockReturnValue(runtime);
		useWebMcpTools.mockReset();
		useToolsApiConnector.mockReset();
	});

	it("uses settings.agentUrl when query is missing", () => {
		const {result} = renderHook(() =>
			useAppBuilderAgent({
				settings: {settings: {agentUrl: "http://localhost:3001/app"}},
			}),
		);
		expect(result.current.agentUrl).toBe("http://localhost:3001/app");
		expect(result.current.agentOpen).toBe(false);
		expect(result.current.snapshotComplete).toBe(true);
	});

	it("query agentUrl wins over settings", () => {
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://localhost:3001/app`,
		);
		const {result} = renderHook(() =>
			useAppBuilderAgent({
				settings: {
					settings: {agentUrl: "http://example.invalid/agent"},
				},
			}),
		);
		expect(result.current.agentUrl).toBe("http://localhost:3001/app");
	});

	it("wires WebMCP and ToolsApi", () => {
		renderHook(() =>
			useAppBuilderAgent({
				namespace: "ns",
				appBuilderParseSettled: true,
			}),
		);
		expect(useAgentToolRuntime).toHaveBeenCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: true,
		});
		expect(useWebMcpTools).toHaveBeenCalledWith({
			namespace: "ns",
			enabled: true,
			resolvedTools: runtime.resolvedTools,
			toolHandlers: runtime.toolHandlers,
			snapshotComplete: true,
		});
		expect(useToolsApiConnector).toHaveBeenCalledWith({
			window: null,
			resolvedTools: runtime.resolvedTools,
			toolHandlers: runtime.toolHandlers,
			snapshotComplete: true,
		});
	});

	it("passes peer window into ToolsApi", () => {
		const {result} = renderHook(() => useAppBuilderAgent({}));
		const peer = {} as Window;
		act(() => {
			result.current.onPeerWindow(peer);
		});
		expect(useToolsApiConnector).toHaveBeenLastCalledWith({
			window: peer,
			resolvedTools: runtime.resolvedTools,
			toolHandlers: runtime.toolHandlers,
			snapshotComplete: true,
		});
	});

	it("onOpen with url sets agentOpen", () => {
		const {result} = renderHook(() =>
			useAppBuilderAgent({
				settings: {settings: {agentUrl: "http://localhost:3001/app"}},
			}),
		);
		act(() => {
			result.current.onOpen();
		});
		expect(result.current.agentOpen).toBe(true);
	});

	it("onOpen without url leaves agentOpen false", () => {
		const {result} = renderHook(() => useAppBuilderAgent({}));
		act(() => {
			result.current.onOpen();
		});
		expect(result.current.agentOpen).toBe(false);
	});
});
