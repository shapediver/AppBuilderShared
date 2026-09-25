/**
 * @jest-environment jsdom
 */
import type {IAppBuilderActionDefinition} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IAppBuilderAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {resolveSpecificTools} from "../config/resolveSpecificTools";
import {bindAgentToolSources} from "../lib/bindAgentToolSources";
import {readInputPath} from "../lib/readInputPath";
import type {AgentToolsDeps} from "../model/agentToolsDeps";
import {runSpecificTool} from "../model/runSpecificTool";

jest.mock("../model/runActionControl", () => ({
	runActionControl: jest.fn(),
}));
jest.mock(
	"@AppBuilderLib/features/appbuilder/model/waitForAppBuilderSessionIdle",
	() => ({
		waitForAppBuilderSessionIdle: jest.fn(async () => undefined),
	}),
);

import {waitForAppBuilderSessionIdle} from "@AppBuilderLib/features/appbuilder/model/waitForAppBuilderSessionIdle";
import {runActionControl} from "../model/runActionControl";

const runActionControlMock = runActionControl as jest.MockedFunction<
	typeof runActionControl
>;

const setWidth: IAppBuilderActionDefinition = {
	type: "setParameterValue",
	props: {
		parameter: {name: "Width"},
		source: {type: "agentTool", props: {path: "width"}},
	},
};

const idleMock = waitForAppBuilderSessionIdle as jest.MockedFunction<
	typeof waitForAppBuilderSessionIdle
>;

const setLength: IAppBuilderActionDefinition = {
	type: "setParameterValue",
	props: {
		parameter: {name: "Length"},
		source: {type: "agentTool", props: {path: "$.length"}},
	},
};

describe("readInputPath", () => {
	it("reads a name, a dotted name, and an index", () => {
		expect(readInputPath({length: 4}, "length")).toEqual({
			ok: true,
			value: 4,
		});
		expect(readInputPath({length: 4}, "$.length")).toEqual({
			ok: true,
			value: 4,
		});
		expect(readInputPath({shelf: {x: 10}}, "shelf.x")).toEqual({
			ok: true,
			value: 10,
		});
		expect(readInputPath({items: ["a"]}, "items[0]")).toEqual({
			ok: true,
			value: "a",
		});
	});

	it("rejects filters, descendants, and slices", () => {
		expect(readInputPath({a: {b: 1}}, "$..b").ok).toBe(false);
		expect(readInputPath({items: [{n: 1}]}, "items[?@.n == 1]").ok).toBe(
			false,
		);
		expect(readInputPath({items: [1, 2, 3]}, "items[1:2]").ok).toBe(false);
	});

	it("rejects a missing path, a bare $name, a trailing dot, and a negative index", () => {
		expect(readInputPath({}, "$.missing").ok).toBe(false);
		expect(readInputPath({length: 4}, "$length").ok).toBe(false);
		expect(readInputPath({length: 4}, "length.").ok).toBe(false);
		expect(readInputPath({items: ["a", "b"]}, "items[-1]").ok).toBe(false);
	});

	it("reads the whole document for $", () => {
		expect(readInputPath({a: 1}, "$")).toEqual({ok: true, value: {a: 1}});
	});
});

describe("bindAgentToolSources", () => {
	it("replaces agentTool with the call value and does not mutate the original", () => {
		const bound = bindAgentToolSources([setLength], {length: 5});
		expect(bound.ok).toBe(true);
		if (!bound.ok) return;
		expect(bound.actions[0]).toEqual({
			type: "setParameterValue",
			props: {parameter: {name: "Length"}, value: 5},
		});
		expect(setLength).toMatchObject({
			props: {source: {type: "agentTool"}},
		});
	});

	it("runs nothing when the path is not one parameter value", () => {
		const bound = bindAgentToolSources([setLength], {length: {mm: 5}});
		expect(bound).toEqual({
			ok: false,
			message:
				"agentTool path did not resolve to a single string, number, boolean, or color",
		});
	});

	it("replaces agentTool with a color object", () => {
		const color = {red: 1, green: 2, blue: 3, alpha: 255};
		const bound = bindAgentToolSources(
			[
				{
					type: "setParameterValue",
					props: {
						parameter: {name: "Colour"},
						source: {
							type: "agentTool",
							props: {path: "$.color"},
						},
					},
				},
			],
			{color},
		);
		expect(bound.ok).toBe(true);
		if (!bound.ok) return;
		expect(bound.actions[0]).toMatchObject({
			props: {value: color},
		});
	});

	it("rejects an item that sets both value and source", () => {
		const bound = bindAgentToolSources(
			[
				{
					type: "setParameterValue",
					props: {
						parameter: {name: "Length"},
						value: "1",
						source: {
							type: "agentTool",
							props: {path: "$.length"},
						},
					},
				},
			],
			{length: 5},
		);
		expect(bound.ok).toBe(false);
	});

	it("fills agentTool inside setParameterValues and nested executeActions", () => {
		const bound = bindAgentToolSources(
			[
				{
					type: "setParameterValues",
					props: {
						parameterValues: [
							{
								parameter: {name: "Length"},
								source: {
									type: "agentTool",
									props: {path: "length"},
								},
							},
							{
								parameter: {name: "Width"},
								source: {
									type: "agentTool",
									props: {path: "width"},
								},
							},
						],
					},
				},
				{
					type: "executeActions",
					props: {
						actions: [setLength],
					},
				},
			],
			{length: 5, width: 2},
		);
		expect(bound.ok).toBe(true);
		if (!bound.ok) return;
		expect(bound.actions[0]).toMatchObject({
			props: {
				parameterValues: [
					{parameter: {name: "Length"}, value: 5},
					{parameter: {name: "Width"}, value: 2},
				],
			},
		});
		expect(bound.actions[1]).toMatchObject({
			props: {
				actions: [
					{
						props: {parameter: {name: "Length"}, value: 5},
					},
				],
			},
		});
	});
});

describe("resolveSpecificTools", () => {
	const agent: IAppBuilderAgent = {
		id: "a",
		name: "A",
		message: "hi",
		specificTools: [
			{
				name: "set_length",
				inputSchema: {type: "object"},
				actionSequence: [setLength],
			},
			{
				name: "set_length",
				description: "later",
				inputSchema: {type: "object"},
			},
			{name: "get_metric", inputSchema: {type: "object"}},
		],
	};

	it("ignores remoteExecution and still resolves the tool", () => {
		const tools = resolveSpecificTools(
			{
				...agent,
				specificTools: [
					{
						name: "set_length",
						inputSchema: {type: "object"},
						remoteExecution: {},
					},
				],
			},
			[],
		);
		expect(tools).toEqual([
			{
				name: "set_length",
				description: "set_length",
				inputSchema: {type: "object"},
				actionSequence: [],
			},
		]);
	});

	it("keeps the last specific tool and skips a registered generic name", () => {
		const tools = resolveSpecificTools(agent, ["get_metric"]);
		expect(tools).toEqual([
			{
				name: "set_length",
				description: "later",
				inputSchema: {type: "object"},
				actionSequence: [],
			},
		]);
	});
});

describe("runSpecificTool", () => {
	const deps = {} as AgentToolsDeps;

	beforeEach(() => {
		runActionControlMock.mockReset();
		idleMock.mockClear();
		runActionControlMock.mockResolvedValue({success: true});
	});

	it("does not call the runner when the input fails inputSchema", async () => {
		const result = await runSpecificTool(
			{
				name: "set_length",
				description: "set_length",
				inputSchema: {
					type: "object",
					properties: {length: {type: "number"}},
					required: ["length"],
					additionalProperties: false,
				},
				actionSequence: [setLength],
			},
			{},
			deps,
		);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.message).toContain("input does not match inputSchema");
		expect(runActionControlMock).not.toHaveBeenCalled();
	});

	it("does not call the runner when binding fails", async () => {
		const result = await runSpecificTool(
			{
				name: "set_length",
				description: "set_length",
				inputSchema: {type: "object"},
				actionSequence: [setLength],
			},
			{},
			deps,
		);
		expect(result.success).toBe(false);
		expect(runActionControlMock).not.toHaveBeenCalled();
	});

	it("runs the rewritten action", async () => {
		const result = await runSpecificTool(
			{
				name: "set_length",
				description: "Set Length",
				inputSchema: {type: "object"},
				actionSequence: [setLength],
			},
			{length: 5},
			deps,
		);
		expect(result).toEqual({success: true});
		expect(runActionControlMock).toHaveBeenCalledWith(
			{
				definition: {
					type: "setParameterValue",
					props: {parameter: {name: "Length"}, value: 5},
				},
			},
			deps,
		);
	});

	it("returns no actionSequence and does not run when the sequence is empty", async () => {
		const result = await runSpecificTool(
			{
				name: "set_length",
				description: "set_length",
				inputSchema: {type: "object"},
				actionSequence: [],
			},
			{},
			deps,
		);
		expect(result).toEqual({
			success: false,
			message: "no actionSequence",
		});
		expect(runActionControlMock).not.toHaveBeenCalled();
	});

	it("runs actions in order and stops after the first failure", async () => {
		runActionControlMock
			.mockResolvedValueOnce({success: false, message: "bad"})
			.mockResolvedValue({success: true});
		const result = await runSpecificTool(
			{
				name: "set_size",
				description: "set_size",
				inputSchema: {type: "object"},
				actionSequence: [setLength, setWidth],
			},
			{length: 5, width: 2},
			deps,
		);
		expect(result).toEqual({success: false, message: "bad"});
		expect(runActionControlMock).toHaveBeenCalledTimes(1);
		expect(idleMock).not.toHaveBeenCalled();

		runActionControlMock.mockReset();
		runActionControlMock.mockResolvedValue({success: true});
		idleMock.mockClear();
		const ok = await runSpecificTool(
			{
				name: "set_size",
				description: "set_size",
				inputSchema: {type: "object"},
				actionSequence: [setLength, setWidth],
			},
			{length: 5, width: 2},
			deps,
		);
		expect(ok).toEqual({success: true});
		expect(runActionControlMock.mock.calls.map((call) => call[0])).toEqual([
			{
				definition: {
					type: "setParameterValue",
					props: {parameter: {name: "Length"}, value: 5},
				},
			},
			{
				definition: {
					type: "setParameterValue",
					props: {parameter: {name: "Width"}, value: 2},
				},
			},
		]);
		expect(idleMock).toHaveBeenCalledTimes(2);
	});
});
