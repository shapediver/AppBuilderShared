/**
 * @jest-environment jsdom
 */

jest.mock("@mantine/notifications", () => ({
	notifications: {
		show: jest.fn(),
		hide: jest.fn(),
		update: jest.fn(),
	},
}));

const useAgentToolTransports = jest.fn();

jest.mock("../useAgentToolTransports", () => ({
	useAgentToolTransports: (...args: unknown[]) =>
		useAgentToolTransports(...args),
}));

jest.mock("../../lib/readAgentUrlEnv", () => ({
	readAgentUrlEnv: jest.fn(() => undefined),
}));

import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {notifications} from "@mantine/notifications";
import {act, renderHook} from "@testing-library/react";
import {readAgentUrlEnv} from "../../lib/readAgentUrlEnv";
import {useAppBuilderAgentHost} from "../useAppBuilderAgentHost";

const transports = {
	resolvedTools: [],
	toolHandlers: {},
	snapshotComplete: true,
};

describe("useAppBuilderAgentHost", () => {
	const originalOpen = window.open;

	beforeEach(() => {
		window.history.replaceState({}, "", "/");
		useAgentToolTransports.mockReset().mockReturnValue(transports);
		jest.mocked(readAgentUrlEnv).mockReset().mockReturnValue(undefined);
		jest.mocked(notifications.show).mockClear();
		window.open = jest.fn().mockReturnValue(null);
	});

	afterEach(() => {
		window.open = originalOpen;
		jest.useRealTimers();
	});

	it("uses settings.agentUrl when query is missing", () => {
		const {result} = renderHook(() =>
			useAppBuilderAgentHost({
				settings: {settings: {agentUrl: "http://localhost:3001/app"}},
			}),
		);
		expect(result.current.agentUrl).toBe("http://localhost:3001/app");
		expect(result.current.isAgentReady).toBe(true);
	});

	it("uses env Agent URL when query and settings are missing", () => {
		jest.mocked(readAgentUrlEnv).mockReturnValue(
			"http://localhost:3001/app",
		);
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		expect(result.current.agentUrl).toBe("http://localhost:3001/app");
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

	it("starts with no peer Window on the connector", () => {
		renderHook(() =>
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
	});

	it("onOpenAgent opens shapediver-agent and passes the Window to transports", () => {
		jest.useFakeTimers();
		const opened = {} as Window;
		jest.mocked(window.open).mockReturnValue(opened);
		const {result} = renderHook(() =>
			useAppBuilderAgentHost({
				namespace: "ns",
				settings: {settings: {agentUrl: "http://localhost:3001/app"}},
			}),
		);
		act(() => {
			result.current.onOpenAgent();
		});
		expect(window.open).toHaveBeenCalledWith(
			"http://localhost:3001/app",
			"shapediver-agent",
			"width=520,height=780",
		);
		expect(useAgentToolTransports).toHaveBeenLastCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: undefined,
			agentWindow: null,
		});
		act(() => {
			jest.runAllTimers();
		});
		expect(useAgentToolTransports).toHaveBeenLastCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: undefined,
			agentWindow: opened,
		});
	});

	it("shows the existing notification when the popup is blocked", () => {
		const {result} = renderHook(() =>
			useAppBuilderAgentHost({
				settings: {settings: {agentUrl: "http://localhost:3001/app"}},
			}),
		);
		act(() => {
			result.current.onOpenAgent();
		});
		expect(notifications.show).toHaveBeenCalledWith(
			expect.objectContaining({
				title: "Agent window blocked",
				message:
					"Allow popups for this site, then try Open agent again.",
				color: "red",
			}),
		);
		expect(useAgentToolTransports).toHaveBeenLastCalledWith(
			expect.objectContaining({agentWindow: null}),
		);
	});

	it("onOpenAgent without url does not open a window", () => {
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		act(() => {
			result.current.onOpenAgent();
		});
		expect(window.open).not.toHaveBeenCalled();
		expect(notifications.show).not.toHaveBeenCalled();
	});
});
