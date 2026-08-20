import type {IAppBuilderAgent} from "../../appbuilder/config/appbuilderagent";
import {IN_SCOPE_GENERIC_TOOL_NAMES} from "../config/inScopeGenericTools";
import {resolveToolset} from "../config/resolveToolset";
import type {IToolsApiHandlerMap} from "../config/toolsApi";
import {executeResolvedTool} from "../lib/executeResolvedTool";
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
