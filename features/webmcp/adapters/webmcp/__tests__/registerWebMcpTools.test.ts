jest.mock("@AppBuilderLib/entities/parameter/lib/parameterStates", () => ({
	getParameterStates: jest.fn(() => []),
}));

jest.mock("../../../lib/computeAppliedParameterIds", () => ({
	computeAppliedParameterIds: jest.fn(),
}));

import type {ToolDeps} from "../../core/deps";
import {registerWebMcpTools} from "../registerWebMcpTools";

describe("registerWebMcpTools", () => {
	it("wraps success into content + structuredContent envelope", async () => {
		const executes: Array<(input: unknown) => Promise<unknown>> = [];
		const modelContext = {
			registerTool: jest.fn(async (tool: any) => {
				executes.push(tool.execute);
			}),
		};

		const deps: ToolDeps = {
			namespace: "main",
			getLiveParameters: () => [],
			listParameterNamespaces: () => ["main"],
			batchParameterValueUpdate: jest.fn(),
			createModelState: jest.fn(),
			importModelState: jest.fn(),
		};

		await registerWebMcpTools(
			modelContext as any,
			() => deps,
			new AbortController().signal,
		);

		expect(modelContext.registerTool).toHaveBeenCalledTimes(5);

		const listSessionsExecute = executes[0];
		const result = (await listSessionsExecute({})) as {
			content: Array<{type: string; text: string}>;
			structuredContent: {sessions: Array<{sessionId: string}>};
			isError?: true;
		};
		expect(result.isError).toBeUndefined();
		expect(result.structuredContent.sessions).toEqual([
			{sessionId: "main"},
		]);
		expect(result.content[0].text).toContain("Found 1 sessions");
	});

	it("maps thrown Error to isError envelope", async () => {
		const executes: Array<(input: unknown) => Promise<unknown>> = [];
		const modelContext = {
			registerTool: jest.fn(async (tool: any) => {
				executes.push(tool.execute);
			}),
		};
		const deps: ToolDeps = {
			namespace: "main",
			getLiveParameters: () => [],
			listParameterNamespaces: () => ["main"],
			batchParameterValueUpdate: jest.fn(),
			createModelState: jest.fn(),
			importModelState: jest.fn(async () => ({
				success: false,
				message: "nope",
			})),
		};
		await registerWebMcpTools(
			modelContext as any,
			() => deps,
			new AbortController().signal,
		);
		// import_model_state is index 4
		const result = (await executes[4]({modelStateId: "x"})) as {
			isError?: true;
			content: Array<{text: string}>;
			structuredContent?: {error?: unknown};
		};
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("nope");
	});

	it("maps ZodError to isError with issues array", async () => {
		const executes: Array<(input: unknown) => Promise<unknown>> = [];
		const modelContext = {
			registerTool: jest.fn(async (tool: any) => {
				executes.push(tool.execute);
			}),
		};
		const deps: ToolDeps = {
			namespace: "main",
			getLiveParameters: () => [],
			listParameterNamespaces: () => ["main"],
			batchParameterValueUpdate: jest.fn(),
			createModelState: jest.fn(),
			importModelState: jest.fn(),
		};
		await registerWebMcpTools(
			modelContext as any,
			() => deps,
			new AbortController().signal,
		);
		// list_parameter_definitions is index 1
		const result = (await executes[1]({filter: "hidden"})) as {
			isError?: true;
			structuredContent?: {error?: unknown};
			content: Array<{text: string}>;
		};
		expect(result.isError).toBe(true);
		expect(Array.isArray(result.structuredContent?.error)).toBe(true);
		expect(result.content[0].text).toContain("Invalid input data");
	});
});
