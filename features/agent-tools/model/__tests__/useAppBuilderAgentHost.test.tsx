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
import type {ToolbarCommandItem} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {getEnvironmentIdentifier} from "@AppBuilderLib/shared/lib/platform/environment";
import {useThemeOverrideStore} from "@AppBuilderLib/shared/model/useThemeOverrideStore";
import {useHostedAgentFrameStore} from "../useHostedAgentFrameStore";
import {MantineProvider} from "@mantine/core";
import {act, renderHook} from "@testing-library/react";
import type {ReactNode} from "react";
import {useAppBuilderAgentHost} from "../useAppBuilderAgentHost";

const sampleAgent: IAppBuilderAgent = {
	id: "configurator",
	name: "Configurator",
	message: "Help the user configure the product.",
};

const transports = {
	resolvedGenericTools: [],
	resolvedSpecificTools: [],
	toolHandlers: {},
	snapshotComplete: true,
	agentConfig: sampleAgent,
};

function themeWrapper(
	mode?: "window" | "iframe",
	showThreadHistory?: boolean,
	createThreadOnLoad?: boolean,
) {
	const defaultProps: {
		mode?: string;
		showThreadHistory?: boolean;
		createThreadOnLoad?: boolean;
	} = {};
	if (mode) defaultProps.mode = mode;
	if (showThreadHistory !== undefined) {
		defaultProps.showThreadHistory = showThreadHistory;
	}
	if (createThreadOnLoad !== undefined) {
		defaultProps.createThreadOnLoad = createThreadOnLoad;
	}
	return function Wrapper({children}: {children: ReactNode}) {
		return (
			<MantineProvider
				theme={{
					components: {
						AgentUi: {defaultProps},
					},
				}}
			>
				{children}
			</MantineProvider>
		);
	};
}

function renderHost(
	props: Parameters<typeof useAppBuilderAgentHost>[0] = {},
	mode?: "window" | "iframe",
	showThreadHistory?: boolean,
	createThreadOnLoad?: boolean,
) {
	return renderHook(() => useAppBuilderAgentHost(props), {
		wrapper: themeWrapper(mode, showThreadHistory, createThreadOnLoad),
	});
}

function agentCommand(): ToolbarCommandItem {
	const toolbar = useShapeDiverStoreToolbars
		.getState()
		.defaultToolbars.find((item) => item.id.startsWith("agentUi"));
	const command = toolbar?.groups
		.flat()
		.find((item) => item.type === "command");
	if (!command || command.type !== "command") {
		throw new Error("agent toolbar command missing");
	}
	return command;
}

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
		useShapeDiverStoreToolbars.setState({defaultToolbars: []});
		useHostedAgentFrameStore.setState({frame: null});
	});

	afterEach(() => {
		window.open = originalOpen;
		jest.useRealTimers();
		useShapeDiverStoreToolbars.setState({defaultToolbars: []});
	});

	it("uses the environment default when query is missing", () => {
		const {result} = renderHost();
		expect(result.current.agentUrl).toBe("http://localhost:3001");
		expect(result.current.mode).toBe("iframe");
		expect(result.current.panelMounted).toBe(false);
	});

	it("query agentUrl wins on localhost", () => {
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://localhost:3001/app`,
		);
		const {result} = renderHost();
		expect(result.current.agentUrl).toBe("http://localhost:3001/app");
	});

	it("ignores query agentUrl on production", () => {
		jest.mocked(getEnvironmentIdentifier).mockReturnValue("production");
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://evil.example/agent`,
		);
		const {result} = renderHost();
		expect(result.current.agentUrl).toBe("https://agent.shapediver.com");
	});

	it("ignores query agentUrl on iframe", () => {
		jest.mocked(getEnvironmentIdentifier).mockReturnValue("iframe");
		window.history.replaceState(
			{},
			"",
			`/?${QUERYPARAM_AGENTURL}=http://evil.example/agent`,
		);
		const {result} = renderHost();
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
		const {result} = renderHost();
		expect(result.current.agentUrl).toBeUndefined();
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.defaultToolbars.some((item) => item.id.startsWith("agentUi")),
		).toBe(false);
	});

	it("hides agentUrl until snapshotComplete", () => {
		useAgentToolTransports.mockReturnValue({
			...transports,
			snapshotComplete: false,
		});
		const {result} = renderHost();
		expect(result.current.agentUrl).toBeUndefined();
		expect(result.current.panelMounted).toBe(false);
		expect(agentCommand().disabled).toBe(true);
		expect(agentCommand().tooltip).toBe("Configurator");
	});

	it("shows a disabled Agent button while the snapshot is still loading", () => {
		useAgentToolTransports.mockReturnValue({
			...transports,
			snapshotComplete: false,
			agentConfig: undefined,
		});
		renderHost();
		expect(agentCommand().disabled).toBe(true);
		expect(agentCommand().tooltip).toBe("Agent");
	});

	it("starts with no peer Window on the connector", () => {
		renderHost({
			namespace: "ns",
			appBuilderParseSettled: true,
		});
		expect(useAgentToolTransports).toHaveBeenCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: true,
			agentWindow: null,
			sessionInfo: undefined,
			showThreadHistory: true,
			createThreadOnLoad: true,
		});
	});

	it("registers a bottom-end toolbar button and toggles the iframe without reloading it", () => {
		const {result} = renderHost();
		const command = agentCommand();
		expect(command.icon).toBe("tabler:message-chatbot");
		expect(command.tooltip).toBe("Configurator");
		expect(command.props.allowDuringExecution).toBe(true);
		expect(command.disabled).toBe(false);
		const toolbar = useShapeDiverStoreToolbars
			.getState()
			.defaultToolbars.find((item) => item.id.startsWith("agentUi"));
		expect(toolbar).toMatchObject({
			side: "bottom",
			align: "end",
			visibility: "always",
		});

		act(() => {
			command.props.execute();
		});
		expect(window.open).not.toHaveBeenCalled();
		expect(result.current.panelMounted).toBe(true);
		expect(result.current.panelVisible).toBe(true);

		act(() => {
			agentCommand().props.execute();
		});
		expect(result.current.panelMounted).toBe(true);
		expect(result.current.panelVisible).toBe(false);
	});

	it("opens shapediver-agent in window mode", () => {
		jest.useFakeTimers();
		const opened = {postMessage: jest.fn()} as unknown as Window;
		jest.mocked(window.open).mockReturnValue(opened);
		renderHost({namespace: "ns"}, "window");
		expect(useAgentToolTransports).toHaveBeenCalledWith(
			expect.objectContaining({
				showThreadHistory: true,
				createThreadOnLoad: true,
			}),
		);
		act(() => {
			agentCommand().props.execute();
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
			showThreadHistory: true,
			createThreadOnLoad: true,
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
			showThreadHistory: true,
			createThreadOnLoad: true,
		});
		expect(showNotification).not.toHaveBeenCalled();
	});

	it("focuses a connected agent window instead of reloading it", () => {
		jest.useFakeTimers();
		const opened = {
			closed: false,
			focus: jest.fn(),
			postMessage: jest.fn(),
		} as unknown as Window;
		jest.mocked(window.open).mockReturnValue(opened);
		const {rerender} = renderHost({}, "window");
		act(() => {
			agentCommand().props.execute();
		});
		act(() => {
			jest.runAllTimers();
		});
		useAgentToolTransports.mockReturnValue({
			...transports,
			peerConnected: true,
		});
		rerender();
		jest.mocked(window.open).mockClear();
		act(() => {
			agentCommand().props.execute();
		});
		expect(opened.focus).toHaveBeenCalledTimes(1);
		expect(window.open).not.toHaveBeenCalled();
	});

	it("reloads the agent window when the connection is down", () => {
		jest.useFakeTimers();
		const opened = {
			closed: false,
			focus: jest.fn(),
			postMessage: jest.fn(),
		} as unknown as Window;
		jest.mocked(window.open).mockReturnValue(opened);
		renderHost({}, "window");
		act(() => {
			agentCommand().props.execute();
		});
		act(() => {
			jest.runAllTimers();
		});
		jest.mocked(window.open).mockClear();
		act(() => {
			agentCommand().props.execute();
		});
		expect(opened.focus).not.toHaveBeenCalled();
		expect(window.open).toHaveBeenCalledWith(
			"http://localhost:3001",
			"shapediver-agent",
			"width=520,height=780",
		);
	});

	it("shows the existing notification when openAgentWindow returns null", () => {
		renderHost({}, "window");
		act(() => {
			agentCommand().props.execute();
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

	it("forwards an explicit history flag", () => {
		renderHost({}, "window", false);
		expect(useAgentToolTransports).toHaveBeenCalledWith(
			expect.objectContaining({
				showThreadHistory: false,
				createThreadOnLoad: true,
			}),
		);
	});

	it("forwards an explicit createThreadOnLoad flag", () => {
		renderHost({}, "iframe", undefined, false);
		expect(useAgentToolTransports).toHaveBeenCalledWith(
			expect.objectContaining({
				showThreadHistory: true,
				createThreadOnLoad: false,
			}),
		);
	});

	it("forwards sessionInfo to transports", () => {
		const sessionInfo = {
			jwtToken: "tok",
			slug: "my-model",
			modelStateId: "ms-1",
		};
		renderHost({
			namespace: "ns",
			sessionInfo,
		});
		expect(useAgentToolTransports).toHaveBeenCalledWith(
			expect.objectContaining({
				sessionInfo,
				showThreadHistory: true,
				createThreadOnLoad: true,
			}),
		);
	});

	it("sends the applied theme file to the agent peer", () => {
		useThemeOverrideStore.getState().setThemeOverride({
			primaryColor: "teal",
			other: {forceColorScheme: "dark"},
		});
		const peer = {postMessage: jest.fn()} as unknown as Window;
		const {unmount} = renderHost();
		act(() => {
			useHostedAgentFrameStore.getState().setFrame(peer);
		});
		expect(peer.postMessage).toHaveBeenCalledWith(
			{
				type: "shapediver:agent-theme",
				themeOverrides: {
					primaryColor: "teal",
					other: {forceColorScheme: "dark"},
				},
			},
			"http://localhost:3001",
		);
		unmount();
		useThemeOverrideStore.getState().setThemeOverride({});
	});

	it("does not register a button when a hostedAgent widget is already placed", () => {
		const {result} = renderHost({
			appBuilderData: {
				version: "1.0",
				containers: [
					{
						name: "right",
						widgets: [
							{
								type: "hostedAgent",
								props: {},
							},
						],
					},
				],
			},
		});
		expect(result.current.panelMounted).toBe(false);
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.defaultToolbars.some((item) => item.id.startsWith("agentUi")),
		).toBe(false);
	});

	it("connects ToolsApi to the hostedAgent frame window", () => {
		const peer = {postMessage: jest.fn()} as unknown as Window;
		renderHost({namespace: "ns"});
		act(() => {
			useHostedAgentFrameStore.getState().setFrame(peer);
		});
		expect(useAgentToolTransports).toHaveBeenLastCalledWith({
			namespace: "ns",
			appBuilderData: undefined,
			appBuilderParseSettled: undefined,
			agentWindow: peer,
			sessionInfo: undefined,
			showThreadHistory: true,
			createThreadOnLoad: true,
		});
	});

	it("connects ToolsApi and theme to a placed hostedAgent iframe in window mode", () => {
		const peer = {postMessage: jest.fn()} as unknown as Window;
		const sessionInfo = {
			jwtToken: "tok",
			slug: "my-model",
			modelStateId: "ms-1",
		};
		const appBuilderData = {
			version: "1.0" as const,
			containers: [
				{
					name: "right" as const,
					widgets: [{type: "hostedAgent" as const, props: {}}],
				},
			],
		};
		useThemeOverrideStore.getState().setThemeOverride({
			primaryColor: "teal",
		});
		renderHost(
			{namespace: "ns", sessionInfo, appBuilderData},
			"window",
		);
		expect(window.open).not.toHaveBeenCalled();
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.defaultToolbars.some((item) => item.id.startsWith("agentUi")),
		).toBe(false);
		expect(useAgentToolTransports).toHaveBeenLastCalledWith(
			expect.objectContaining({
				agentWindow: null,
				sessionInfo,
			}),
		);

		act(() => {
			useHostedAgentFrameStore.getState().setFrame(peer);
		});

		expect(useAgentToolTransports).toHaveBeenLastCalledWith({
			namespace: "ns",
			appBuilderData,
			appBuilderParseSettled: undefined,
			agentWindow: peer,
			sessionInfo,
			showThreadHistory: true,
			createThreadOnLoad: true,
		});
		expect(peer.postMessage).toHaveBeenCalledWith(
			{
				type: "shapediver:agent-theme",
				themeOverrides: {primaryColor: "teal"},
			},
			"http://localhost:3001",
		);
		useThemeOverrideStore.getState().setThemeOverride({});
	});

	it("prefers a registered hostedAgent iframe over an open popup", () => {
		jest.useFakeTimers();
		const opened = {
			closed: false,
			focus: jest.fn(),
			postMessage: jest.fn(),
		} as unknown as Window;
		jest.mocked(window.open).mockReturnValue(opened);
		const peer = {postMessage: jest.fn()} as unknown as Window;
		renderHost({namespace: "ns"}, "window");
		act(() => {
			agentCommand().props.execute();
		});
		act(() => {
			jest.runAllTimers();
		});
		expect(useAgentToolTransports).toHaveBeenLastCalledWith(
			expect.objectContaining({agentWindow: opened}),
		);

		act(() => {
			useHostedAgentFrameStore.getState().setFrame(peer);
		});
		expect(useAgentToolTransports).toHaveBeenLastCalledWith(
			expect.objectContaining({agentWindow: peer}),
		);
		expect(peer.postMessage).toHaveBeenCalledWith(
			expect.objectContaining({type: "shapediver:agent-theme"}),
			"http://localhost:3001",
		);
	});

	it("warns when two placed hostedAgent widgets are active", () => {
		const warn = jest.spyOn(Logger, "warn").mockImplementation(() => {});
		renderHost({
			appBuilderData: {
				version: "1.0",
				containers: [
					{
						name: "right",
						widgets: [
							{type: "hostedAgent", props: {}},
							{type: "hostedAgent", props: {}},
						],
					},
				],
			},
		});
		expect(warn).toHaveBeenCalledWith(
			"Multiple hostedAgent widgets are active; only one ToolsApi peer is connected.",
		);
		warn.mockRestore();
	});

	it("does not register a button when there is no agent url", () => {
		useAgentToolTransports.mockReturnValue({
			...transports,
			agentConfig: undefined,
		});
		renderHost();
		expect(window.open).not.toHaveBeenCalled();
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.defaultToolbars.some((item) => item.id.startsWith("agentUi")),
		).toBe(false);
	});
});
