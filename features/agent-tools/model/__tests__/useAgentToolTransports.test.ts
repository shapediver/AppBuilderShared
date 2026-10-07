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
	useToolsApiConnector: (...args: unknown[]) => useToolsApiConnector(...args),
}));

import {renderHook} from "@testing-library/react";
import {useAgentToolTransports} from "../useAgentToolTransports";

const runtime = {
	resolvedGenericTools: [],
	resolvedSpecificTools: [],
	toolHandlers: {},
	snapshotComplete: true,
	agentConfig: {id: "a", name: "A", message: "hi"},
};

describe("useAgentToolTransports", () => {
	beforeEach(() => {
		useAgentToolRuntime.mockReset().mockReturnValue(runtime);
		useWebMcpTools.mockReset();
		useToolsApiConnector.mockReset();
	});

	it("wires WebMCP and ToolsApi from one runtime", () => {
		renderHook(() =>
			useAgentToolTransports({
				namespace: "ns",
				appBuilderParseSettled: true,
			}),
		);
		expect(useAgentToolRuntime).toHaveBeenCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: true,
			agentId: undefined,
		});
		expect(useWebMcpTools).toHaveBeenCalledWith({
			namespace: "ns",
			enabled: true,
			resolvedGenericTools: runtime.resolvedGenericTools,
			resolvedSpecificTools: runtime.resolvedSpecificTools,
			toolHandlers: runtime.toolHandlers,
			snapshotComplete: true,
		});
		expect(useToolsApiConnector).toHaveBeenCalledWith({
			window: null,
			resolvedGenericTools: runtime.resolvedGenericTools,
			resolvedSpecificTools: runtime.resolvedSpecificTools,
			toolHandlers: runtime.toolHandlers,
			snapshotComplete: true,
			agentConfig: runtime.agentConfig,
			sessionInfo: undefined,
			showThreadHistory: undefined,
			createThreadOnLoad: undefined,
		});
	});

	it("passes agentWindow into ToolsApi", () => {
		const agentWindow = {} as Window;
		renderHook(() => useAgentToolTransports({agentWindow}));
		expect(useToolsApiConnector).toHaveBeenCalledWith({
			window: agentWindow,
			resolvedGenericTools: runtime.resolvedGenericTools,
			resolvedSpecificTools: runtime.resolvedSpecificTools,
			toolHandlers: runtime.toolHandlers,
			snapshotComplete: true,
			agentConfig: runtime.agentConfig,
			sessionInfo: undefined,
			showThreadHistory: undefined,
			createThreadOnLoad: undefined,
		});
	});

	it("passes agentId into the runtime snapshot", () => {
		renderHook(() => useAgentToolTransports({agentId: "other"}));
		expect(useAgentToolRuntime).toHaveBeenCalledWith(
			expect.objectContaining({agentId: "other"}),
		);
	});

	it("passes AgentUi flags into ToolsApi", () => {
		renderHook(() =>
			useAgentToolTransports({
				showThreadHistory: false,
				createThreadOnLoad: true,
			}),
		);
		expect(useToolsApiConnector).toHaveBeenCalledWith(
			expect.objectContaining({
				showThreadHistory: false,
				createThreadOnLoad: true,
			}),
		);
	});

	it("passes sessionInfo into ToolsApi alongside agentConfig", () => {
		const sessionInfo = {
			jwtToken: "tok",
			slug: "my-model",
			modelStateId: "ms-1",
		};
		renderHook(() => useAgentToolTransports({sessionInfo}));
		expect(useToolsApiConnector).toHaveBeenCalledWith({
			window: null,
			resolvedGenericTools: runtime.resolvedGenericTools,
			resolvedSpecificTools: runtime.resolvedSpecificTools,
			toolHandlers: runtime.toolHandlers,
			snapshotComplete: true,
			agentConfig: runtime.agentConfig,
			sessionInfo,
			showThreadHistory: undefined,
			createThreadOnLoad: undefined,
		});
	});
});
