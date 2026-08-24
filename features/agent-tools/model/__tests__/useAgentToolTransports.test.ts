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
	resolvedTools: [],
	toolHandlers: {},
	snapshotComplete: true,
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

	it("passes agentWindow into ToolsApi", () => {
		const agentWindow = {} as Window;
		renderHook(() => useAgentToolTransports({agentWindow}));
		expect(useToolsApiConnector).toHaveBeenCalledWith({
			window: agentWindow,
			resolvedTools: runtime.resolvedTools,
			toolHandlers: runtime.toolHandlers,
			snapshotComplete: true,
		});
	});
});
