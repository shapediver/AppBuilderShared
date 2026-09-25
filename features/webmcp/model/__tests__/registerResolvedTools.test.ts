import {IN_SCOPE_GENERIC_TOOL_NAMES} from "@AppBuilderLib/features/agent-tools/config/inScopeGenericTools";
import type {ExecutableSpecificTool} from "@AppBuilderLib/features/agent-tools/config/resolveSpecificTools";
import type {ResolvedGenericTool} from "@AppBuilderLib/features/agent-tools/config/resolveToolset";
import {INPUT_SCHEMA_BY_TOOL} from "@AppBuilderLib/features/agent-tools/config/schemaFor";
import {AGENT_TOOL_META} from "@AppBuilderLib/features/agent-tools/config/toolMeta";
import type {IToolsApiHandlerMap} from "@AppBuilderLib/features/agent-tools/config/toolsApiConnector";
import {zodToJsonSchema} from "@AppBuilderLib/features/agent-tools/lib/zodToJsonSchema";
import type {ModelContext} from "../../lib/webmcpAvailability";
import {registerResolvedTools} from "../registerResolvedTools";

describe("INPUT_SCHEMA_BY_TOOL", () => {
	it("has a schema for every in-scope generic tool", () => {
		expect(Object.keys(INPUT_SCHEMA_BY_TOOL).sort()).toEqual(
			[...IN_SCOPE_GENERIC_TOOL_NAMES].sort(),
		);
		for (const name of IN_SCOPE_GENERIC_TOOL_NAMES) {
			expect(INPUT_SCHEMA_BY_TOOL[name]).toBeDefined();
		}
	});

	it("converts each schema to a JSON Schema object type", () => {
		for (const name of IN_SCOPE_GENERIC_TOOL_NAMES) {
			const jsonSchema = zodToJsonSchema(INPUT_SCHEMA_BY_TOOL[name]);
			expect(jsonSchema.type).toBe("object");
		}
	});
});

describe("AGENT_TOOL_META", () => {
	it("has meta for every in-scope generic tool", () => {
		expect(Object.keys(AGENT_TOOL_META).sort()).toEqual(
			[...IN_SCOPE_GENERIC_TOOL_NAMES].sort(),
		);
		for (const name of IN_SCOPE_GENERIC_TOOL_NAMES) {
			expect(AGENT_TOOL_META[name]).toBeDefined();
		}
	});
});

const execute = jest.fn(async () => ({success: true}));
const setLength: ExecutableSpecificTool = {
	name: "set_length",
	description: "Set the Length parameter",
	inputSchema: {type: "object"},
	actionSequence: [],
	execute,
};

describe("registerResolvedTools specific tools", () => {
	it("registers the specific tool and runs it through the specific runner", async () => {
		const registerTool = jest.fn(async () => undefined);
		const modelContext = {registerTool} as unknown as ModelContext;

		await registerResolvedTools(
			modelContext,
			[],
			{} as IToolsApiHandlerMap,
			new AbortController().signal,
			[setLength],
		);

		expect(registerTool).toHaveBeenCalledTimes(1);
		const registered = registerTool.mock.calls[0][0];
		expect(registered).toMatchObject({
			name: "set_length",
			description: "Set the Length parameter",
			inputSchema: {type: "object"},
			annotations: {readOnlyHint: false, untrustedContentHint: true},
		});
		expect(JSON.stringify(registered)).not.toContain("actionSequence");

		await registered.execute(
			{length: 4},
			{
				signal: new AbortController().signal,
			},
		);
		expect(execute).toHaveBeenCalledWith({length: 4});
	});

	it("registers generic tools before specific tools", async () => {
		const registerTool = jest.fn(async () => undefined);
		const modelContext = {registerTool} as unknown as ModelContext;
		const generic: ResolvedGenericTool = {
			name: "get_screenshot",
			settings: {name: "get_screenshot"},
		};

		await registerResolvedTools(
			modelContext,
			[generic],
			{
				get_screenshot: async () => ({success: true}),
			} as IToolsApiHandlerMap,
			new AbortController().signal,
			[setLength],
		);

		expect(registerTool.mock.calls.map((call) => call[0].name)).toEqual([
			"get_screenshot",
			"set_length",
		]);
	});
});
