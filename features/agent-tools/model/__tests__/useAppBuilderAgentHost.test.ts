/**
 * @jest-environment jsdom
 */

const useAgentToolTransports = jest.fn();

jest.mock("../useAgentToolTransports", () => ({
	useAgentToolTransports: (...args: unknown[]) =>
		useAgentToolTransports(...args),
}));

import {act, renderHook} from "@testing-library/react";
import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {useAppBuilderAgentHost} from "../useAppBuilderAgentHost";

const transports = {
	resolvedTools: [],
	toolHandlers: {},
	snapshotComplete: true,
};

describe("useAppBuilderAgentHost", () => {
	beforeEach(() => {
		window.history.replaceState({}, "", "/");
		useAgentToolTransports.mockReset().mockReturnValue(transports);
	});

	it("uses settings.agentUrl when query is missing", () => {
		const {result} = renderHook(() =>
			useAppBuilderAgentHost({
				settings: {settings: {agentUrl: "http://localhost:3001/app"}},
			}),
		);
		expect(result.current.agentUrl).toBe("http://localhost:3001/app");
		expect(result.current.isAgentOpen).toBe(false);
		expect(result.current.isAgentReady).toBe(true);
	});

	it("query agentUrl wins over settings", () => {
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://localhost:3001/app`,
		);
		const {result} = renderHook(() =>
			useAppBuilderAgentHost({
				settings: {
					settings: {agentUrl: "http://example.invalid/agent"},
				},
			}),
		);
		expect(result.current.agentUrl).toBe("http://localhost:3001/app");
	});

	it("maps snapshotComplete to isAgentReady", () => {
		useAgentToolTransports.mockReturnValue({
			...transports,
			snapshotComplete: false,
		});
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		expect(result.current.isAgentReady).toBe(false);
	});

	it("passes agent window into transports", () => {
		const {result} = renderHook(() =>
			useAppBuilderAgentHost({
				namespace: "ns",
				appBuilderParseSettled: true,
			}),
		);
		expect(useAgentToolTransports).toHaveBeenCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: true,
			agentWindow: null,
		});
		const agentWindow = {} as Window;
		act(() => {
			result.current.onAgentWindow(agentWindow);
		});
		expect(useAgentToolTransports).toHaveBeenLastCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: true,
			agentWindow,
		});
	});

	it("onOpenAgent with url sets isAgentOpen", () => {
		const {result} = renderHook(() =>
			useAppBuilderAgentHost({
				settings: {settings: {agentUrl: "http://localhost:3001/app"}},
			}),
		);
		act(() => {
			result.current.onOpenAgent();
		});
		expect(result.current.isAgentOpen).toBe(true);
	});

	it("onOpenAgent without url leaves isAgentOpen false", () => {
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		act(() => {
			result.current.onOpenAgent();
		});
		expect(result.current.isAgentOpen).toBe(false);
	});
});
