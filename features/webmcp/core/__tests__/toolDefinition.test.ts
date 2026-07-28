import type {ToolDeps} from "../deps";
import {
	ToolExecutionError,
	type AnyToolDef,
	type ToolDef,
	type ToolResult,
} from "../toolDefinition";

describe("core tool scaffolding", () => {
	it("ToolResult is the structured type itself", () => {
		const value: ToolResult<{sessions: Array<{sessionId: string}>}> = {
			sessions: [{sessionId: "s1"}],
		};
		expect(value.sessions[0].sessionId).toBe("s1");
	});

	it("ToolExecutionError carries optional structuredContent", () => {
		const err = new ToolExecutionError("boom", {
			applied: [],
			errors: [{name: "x", message: "y"}],
		});
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("boom");
		expect(err.structuredContent).toEqual({
			applied: [],
			errors: [{name: "x", message: "y"}],
		});
	});

	it("ToolDef shape is assignable to AnyToolDef", () => {
		const tool: ToolDef<{n: number}, {ok: boolean}> = {
			name: "example",
			description: "example tool",
			inputSchema: {parse: (v) => v} as ToolDef<
				{n: number},
				{ok: boolean}
			>["inputSchema"],
			outputSchema: {parse: (v) => v} as ToolDef<
				{n: number},
				{ok: boolean}
			>["outputSchema"],
			annotations: {readOnlyHint: true, untrustedContentHint: true},
			execute: async (_deps, input) => ({ok: input.n > 0}),
			format: (output) => (output.ok ? "ok" : "no"),
		};
		const anyTool: AnyToolDef = tool;
		expect(anyTool.name).toBe("example");
	});

	it("ToolDeps keys match plain deps contract", () => {
		const keys: Array<keyof ToolDeps> = [
			"namespace",
			"getLiveParameters",
			"listParameterNamespaces",
			"batchParameterValueUpdate",
			"createModelState",
			"importModelState",
		];
		expect(keys).toHaveLength(6);
	});
});
