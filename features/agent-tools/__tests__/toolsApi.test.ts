/**
 * @jest-environment jsdom
 */
import type {
	ICrossWindowApi,
	ICrossWindowPeerInfo,
} from "@AppBuilderLib/shared/config/crosswindowapi/crosswindowapi";
import type {IAppBuilderAgent} from "../../appbuilder/config/appbuilderagent";
import {ToolsApi, ToolsApiConnector} from "../api/toolsApi";
import {IN_SCOPE_GENERIC_TOOL_NAMES} from "../config/inScopeGenericTools";
import {resolveToolset} from "../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../config/toolsApi";
import {
	MESSAGE_TYPE_EXECUTE_TOOL,
	MESSAGE_TYPE_LIST_TOOLS,
} from "../config/toolsApi";
import {
	executeResolvedTool,
	unknownToolResult,
} from "../lib/executeResolvedTool";
import {listToolsFromResolved} from "../lib/listToolsFromResolved";

function screenshotOnlyAgent(): IAppBuilderAgent {
	return {
		id: "a",
		name: "A",
		message: "hi",
		useGenericToolDefaults: false,
		genericTools: [{name: "get_screenshot"}],
	};
}

function stubHandlers(
	overrides: Partial<IToolsApiHandlerMap> = {},
): IToolsApiHandlerMap {
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
		...overrides,
	};
}

describe("listToolsFromResolved", () => {
	it("lists eight default in-scope tools with description and inputSchema", () => {
		const {tools} = listToolsFromResolved(resolveToolset(undefined));
		expect(tools.map((t) => t.name)).toEqual([...IN_SCOPE_GENERIC_TOOL_NAMES]);
		for (const tool of tools) {
			expect(typeof tool.description).toBe("string");
			expect(tool.description.length).toBeGreaterThan(0);
			expect(tool.inputSchema).toEqual(expect.any(Object));
		}
	});

	it("lists only get_screenshot when defaults are off and overlay is screenshot-only", () => {
		const {tools} = listToolsFromResolved(
			resolveToolset(screenshotOnlyAgent()),
		);
		expect(tools.map((t) => t.name)).toEqual(["get_screenshot"]);
	});

	it("returns an empty tools array for an empty resolved set", () => {
		expect(listToolsFromResolved([]).tools).toEqual([]);
	});
});

describe("executeResolvedTool", () => {
	it("calls the matching handler with input and returns its JSON", async () => {
		const get_screenshot = jest.fn(async (input: unknown) => ({
			success: true,
			echo: input,
		}));
		const result = await executeResolvedTool(
			"get_screenshot",
			{viewportId: "vp"},
			resolveToolset(undefined),
			stubHandlers({get_screenshot}),
		);
		expect(get_screenshot).toHaveBeenCalledWith({viewportId: "vp"});
		expect(result).toEqual({success: true, echo: {viewportId: "vp"}});
	});

	it("returns JSON for an unknown name without calling handlers", async () => {
		const handlers = stubHandlers();
		const spy = jest.spyOn(handlers, "get_screenshot");
		const result = await executeResolvedTool(
			"nope",
			{},
			resolveToolset(undefined),
			handlers,
		);
		expect(result).toEqual({
			success: false,
			message: 'Tool "nope" does not exist.',
		});
		expect(spy).not.toHaveBeenCalled();
	});

	it("treats a handler that is not in resolved as unknown", async () => {
		const list_parameter_definitions = jest.fn(async () => ({
			parameters: [],
		}));
		const result = await executeResolvedTool(
			"list_parameter_definitions",
			{},
			resolveToolset(screenshotOnlyAgent()),
			stubHandlers({list_parameter_definitions}),
		);
		expect(result).toEqual({
			success: false,
			message: 'Tool "list_parameter_definitions" does not exist.',
		});
		expect(list_parameter_definitions).not.toHaveBeenCalled();
	});

	it("wraps handler throw as JSON", async () => {
		const result = await executeResolvedTool(
			"get_screenshot",
			{},
			resolveToolset(undefined),
			stubHandlers({
				get_screenshot: async () => {
					throw new Error("boom");
				},
			}),
		);
		expect(result).toEqual({success: false, message: "boom"});
	});
});

function createMockCrossWindowApi(options?: {
	handshake?: () => Promise<ICrossWindowPeerInfo>;
}): ICrossWindowApi {
	const handlers = new Map<
		string,
		(data: unknown) => Promise<unknown>
	>();
	const peer: ICrossWindowPeerInfo = {origin: "test", name: "agent"};
	return {
		name: "app",
		peerName: "agent",
		peerIsReady: Promise.resolve(peer),
		send: async (type, data) => {
			const handler = handlers.get(type);
			if (!handler) {
				throw new Error(`No handler for ${type}`);
			}
			return handler(data) as never;
		},
		on: (type, handler) => {
			handlers.set(type, handler as (data: unknown) => Promise<unknown>);
			return {
				cancel: () => {
					handlers.delete(type);
				},
			};
		},
		once: async () => {
			throw new Error("once unused in ToolsApi tests");
		},
		handshake: options?.handshake ?? (async () => peer),
	};
}

describe("ToolsApi over mock ICrossWindowApi", () => {
	it("listTools returns the resolved set", async () => {
		const mock = createMockCrossWindowApi();
		const connector = new ToolsApiConnector(
			resolveToolset(undefined),
			stubHandlers(),
			mock,
		);
		const client = new ToolsApi(mock);
		await Promise.all([connector.peerIsReady, client.peerIsReady]);
		const {tools} = await client.listTools();
		expect(tools.map((t) => t.name)).toEqual([...IN_SCOPE_GENERIC_TOOL_NAMES]);
		connector.cancel();
	});

	it("execute routes to the handler through EXECUTE_TOOL", async () => {
		const mock = createMockCrossWindowApi();
		const get_screenshot = jest.fn(async (input: unknown) => ({
			success: true,
			input,
		}));
		const connector = new ToolsApiConnector(
			resolveToolset(undefined),
			stubHandlers({get_screenshot}),
			mock,
		);
		const client = new ToolsApi(mock);
		await Promise.all([connector.peerIsReady, client.peerIsReady]);
		const result = await client.execute({
			name: "get_screenshot",
			input: {viewportId: "vp"},
		});
		expect(get_screenshot).toHaveBeenCalledWith({viewportId: "vp"});
		expect(result).toEqual({
			success: true,
			input: {viewportId: "vp"},
		});
		connector.cancel();
	});

	it("execute of a name not in resolved does not call the handler", async () => {
		const mock = createMockCrossWindowApi();
		const list_parameter_definitions = jest.fn(async () => ({
			parameters: [],
		}));
		const connector = new ToolsApiConnector(
			resolveToolset(screenshotOnlyAgent()),
			stubHandlers({list_parameter_definitions}),
			mock,
		);
		const client = new ToolsApi(mock);
		await Promise.all([connector.peerIsReady, client.peerIsReady]);
		const result = await client.execute({
			name: "list_parameter_definitions",
			input: {},
		});
		expect(result).toEqual({
			success: false,
			message: 'Tool "list_parameter_definitions" does not exist.',
		});
		expect(list_parameter_definitions).not.toHaveBeenCalled();
		connector.cancel();
	});

	it("EXECUTE_TOOL with missing or non-object data returns unknown-tool JSON, does not throw", async () => {
		const mock = createMockCrossWindowApi();
		const connector = new ToolsApiConnector(
			resolveToolset(undefined),
			stubHandlers(),
			mock,
		);
		const client = new ToolsApi(mock);
		await Promise.all([connector.peerIsReady, client.peerIsReady]);

		await expect(
			mock.send(MESSAGE_TYPE_EXECUTE_TOOL, undefined),
		).resolves.toEqual(unknownToolResult(""));
		await expect(
			mock.send(MESSAGE_TYPE_EXECUTE_TOOL, null as never),
		).resolves.toEqual(unknownToolResult(""));
		await expect(
			mock.send(MESSAGE_TYPE_EXECUTE_TOOL, {} as never),
		).resolves.toEqual(unknownToolResult(""));

		connector.cancel();
	});

	it("cancel unregisters LIST_TOOLS and EXECUTE_TOOL", async () => {
		const mock = createMockCrossWindowApi();
		const connector = new ToolsApiConnector(
			resolveToolset(undefined),
			stubHandlers(),
			mock,
		);
		const client = new ToolsApi(mock);
		await Promise.all([connector.peerIsReady, client.peerIsReady]);
		connector.cancel();
		await expect(client.listTools()).rejects.toThrow(
			`No handler for ${MESSAGE_TYPE_LIST_TOOLS}`,
		);
		await expect(
			client.execute({name: "get_screenshot", input: {}}),
		).rejects.toThrow(`No handler for ${MESSAGE_TYPE_EXECUTE_TOOL}`);
	});

	it("cancel before handshake resolves unregisters both listeners", async () => {
		let resolveHandshake!: (peer: ICrossWindowPeerInfo) => void;
		const pendingHandshake = new Promise<ICrossWindowPeerInfo>((resolve) => {
			resolveHandshake = resolve;
		});
		const mock = createMockCrossWindowApi({
			handshake: () => pendingHandshake,
		});
		const connector = new ToolsApiConnector(
			resolveToolset(undefined),
			stubHandlers(),
			mock,
		);
		connector.cancel();
		resolveHandshake({origin: "test", name: "agent"});
		await connector.peerIsReady;
		await expect(
			mock.send(MESSAGE_TYPE_LIST_TOOLS, undefined),
		).rejects.toThrow(`No handler for ${MESSAGE_TYPE_LIST_TOOLS}`);
		await expect(
			mock.send(MESSAGE_TYPE_EXECUTE_TOOL, {
				name: "get_screenshot",
				input: {},
			}),
		).rejects.toThrow(`No handler for ${MESSAGE_TYPE_EXECUTE_TOOL}`);
	});
});
