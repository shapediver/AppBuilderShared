/**
 * @jest-environment jsdom
 */

const showNotification = jest.fn();

jest.mock(
	"@AppBuilderLib/features/notifications/model/useNotificationStore",
	() => ({
		useNotificationStore: {
			getState: () => ({show: showNotification}),
		},
	}),
);

const useAgentToolTransports = jest.fn();

jest.mock("../useAgentToolTransports", () => ({
	useAgentToolTransports: (...args: unknown[]) =>
		useAgentToolTransports(...args),
}));

jest.mock("@AppBuilderLib/shared/lib/platform/environment", () => ({
	...jest.requireActual("@AppBuilderLib/shared/lib/platform/environment"),
	getEnvironmentIdentifier: jest.fn(() => "localhost"),
}));

import type {IAppBuilderAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {getEnvironmentIdentifier} from "@AppBuilderLib/shared/lib/platform/environment";
import {act, renderHook} from "@testing-library/react";
import {useAppBuilderAgentHost} from "../useAppBuilderAgentHost";

const sampleAgent: IAppBuilderAgent = {
	id: "configurator",
	name: "Configurator",
	message: "Help the user configure the product.",
};

const transports = {
	resolvedTools: [],
	toolHandlers: {},
	snapshotComplete: true,
	agentConfig: sampleAgent,
};

describe("useAppBuilderAgentHost", () => {
	const originalOpen = window.open;

	beforeEach(() => {
		window.history.replaceState({}, "", "/");
		useAgentToolTransports.mockReset().mockReturnValue(transports);
		jest.mocked(getEnvironmentIdentifier)
			.mockReset()
			.mockReturnValue("localhost");
		showNotification.mockClear();
		window.open = jest.fn().mockReturnValue(null);
	});

	afterEach(() => {
		window.open = originalOpen;
		jest.useRealTimers();
	});

	it("uses the environment default when query is missing", () => {
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		expect(result.current.agentUrl).toBe("http://localhost:3001");
		expect(result.current.isAgentReady).toBe(true);
	});

	it("query agentUrl wins on localhost", () => {
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://localhost:3001/app`,
		);
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		expect(result.current.agentUrl).toBe("http://localhost:3001/app");
	});

	it("ignores query agentUrl on production", () => {
		jest.mocked(getEnvironmentIdentifier).mockReturnValue("production");
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://evil.example/agent`,
		);
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		expect(result.current.agentUrl).toBe("https://agent.shapediver.com");
	});

	it("ignores query agentUrl on iframe", () => {
		jest.mocked(getEnvironmentIdentifier).mockReturnValue("iframe");
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://evil.example/agent`,
		);
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		expect(result.current.agentUrl).toBe("https://agent.shapediver.com");
	});

	it("hides agentUrl when there is no agent even if query is set", () => {
		useAgentToolTransports.mockReturnValue({
			...transports,
			agentConfig: undefined,
		});
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://localhost:3001/app`,
		);
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		expect(result.current.agentUrl).toBeUndefined();
	});

	it("hides agentUrl until snapshotComplete", () => {
		useAgentToolTransports.mockReturnValue({
			...transports,
			snapshotComplete: false,
		});
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		expect(result.current.agentUrl).toBeUndefined();
		expect(result.current.isAgentReady).toBe(false);
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
			sessionInfo: undefined,
		});
	});

	it("onOpenAgent opens shapediver-agent and passes the Window to transports", () => {
		jest.useFakeTimers();
		const opened = {} as Window;
		jest.mocked(window.open).mockReturnValue(opened);
		const {result} = renderHook(() =>
			useAppBuilderAgentHost({
				namespace: "ns",
			}),
		);
		act(() => {
			result.current.onOpenAgent();
		});
		expect(window.open).toHaveBeenCalledWith(
			"http://localhost:3001",
			"shapediver-agent",
			"width=520,height=780",
		);
		expect(useAgentToolTransports).toHaveBeenLastCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: undefined,
			agentWindow: null,
			sessionInfo: undefined,
		});
		act(() => {
			jest.runAllTimers();
		});
		expect(useAgentToolTransports).toHaveBeenLastCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: undefined,
			agentWindow: opened,
			sessionInfo: undefined,
		});
		expect(showNotification).not.toHaveBeenCalled();
	});

	it("shows the existing notification when openAgentWindow returns null", () => {
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		act(() => {
			result.current.onOpenAgent();
		});
		expect(showNotification).toHaveBeenCalledWith({
			title: "Could not open agent window.",
			message:
				"The agent window is not connected. Close it if it is open, then try Open agent again.",
			color: "red",
		});
		expect(showNotification.mock.calls[0]?.[0]?.title).not.toMatch(
			/popup/i,
		);
		expect(showNotification.mock.calls[0]?.[0]?.message).not.toMatch(
			/allow popups/i,
		);
		expect(useAgentToolTransports).toHaveBeenLastCalledWith(
			expect.objectContaining({agentWindow: null}),
		);
	});

	it("forwards sessionInfo to transports", () => {
		const sessionInfo = {
			jwtToken: "tok",
			slug: "my-model",
			modelStateId: "ms-1",
		};
		renderHook(() =>
			useAppBuilderAgentHost({
				namespace: "ns",
				sessionInfo,
			}),
		);
		expect(useAgentToolTransports).toHaveBeenCalledWith(
			expect.objectContaining({sessionInfo}),
		);
	});

	it("onOpenAgent without url does not open a window", () => {
		useAgentToolTransports.mockReturnValue({
			...transports,
			agentConfig: undefined,
		});
		const {result} = renderHook(() => useAppBuilderAgentHost({}));
		act(() => {
			result.current.onOpenAgent();
		});
		expect(window.open).not.toHaveBeenCalled();
		expect(showNotification).not.toHaveBeenCalled();
	});
});
