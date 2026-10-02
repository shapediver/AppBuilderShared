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
import {getEnvironmentIdentifier} from "@AppBuilderLib/shared/lib/platform/environment";
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

function themeWrapper(mode?: "window" | "iframe", showThreadHistory?: boolean) {
	const defaultProps: {mode?: string; showThreadHistory?: boolean} = {};
	if (mode) defaultProps.mode = mode;
	if (showThreadHistory !== undefined) {
		defaultProps.showThreadHistory = showThreadHistory;
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
) {
	return renderHook(() => useAppBuilderAgentHost(props), {
		wrapper: themeWrapper(mode, showThreadHistory),
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
			showThreadHistory: false,
		});
	});

	it("registers a bottom-end toolbar button and toggles the iframe without reloading it", () => {
		const {result} = renderHost();
		const command = agentCommand();
		expect(command.icon).toBe("tabler:message-chatbot");
		expect(command.tooltip).toBe("Configurator");
		expect(command.active).toBe(false);
		expect(command.props.allowDuringExecution).toBe(true);
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
		expect(agentCommand().active).toBe(true);

		act(() => {
			agentCommand().props.execute();
		});
		expect(result.current.panelMounted).toBe(true);
		expect(result.current.panelVisible).toBe(false);
		expect(agentCommand().active).toBe(false);
	});

	it("opens shapediver-agent in window mode", () => {
		jest.useFakeTimers();
		const opened = {} as Window;
		jest.mocked(window.open).mockReturnValue(opened);
		renderHost({namespace: "ns"}, "window");
		expect(useAgentToolTransports).toHaveBeenCalledWith(
			expect.objectContaining({showThreadHistory: true}),
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
		});
		expect(showNotification).not.toHaveBeenCalled();
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
			expect.objectContaining({showThreadHistory: false}),
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
			expect.objectContaining({sessionInfo, showThreadHistory: false}),
		);
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
