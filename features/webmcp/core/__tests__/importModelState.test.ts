import type {ToolDeps} from "../deps";
import {importModelStateTool} from "../importModelState";
import {ToolExecutionError} from "../toolDefinition";

jest.mock("@AppBuilderLib/entities/parameter/lib/parameterStates", () => ({
	getParameterStates: jest.fn(),
}));

jest.mock("../../lib/computeAppliedParameterIds", () => ({
	computeAppliedParameterIds: jest.fn(),
}));

import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {computeAppliedParameterIds} from "../../lib/computeAppliedParameterIds";

const getParameterStatesMock = getParameterStates as jest.MockedFunction<
	typeof getParameterStates
>;
const computeAppliedMock = computeAppliedParameterIds as jest.MockedFunction<
	typeof computeAppliedParameterIds
>;

function mockDeps(importModelState: ToolDeps["importModelState"]): ToolDeps {
	return {
		namespace: "main",
		getLiveParameters: () => [],
		listParameterNamespaces: () => ["main"],
		batchParameterValueUpdate: jest.fn(),
		createModelState: jest.fn(),
		importModelState,
	};
}

describe("importModelStateTool", () => {
	const signal = new AbortController().signal;

	beforeEach(() => {
		getParameterStatesMock.mockReset();
		computeAppliedMock.mockReset();
		getParameterStatesMock.mockReturnValue([
			{
				definition: {id: "width"},
				state: {uiValue: 1},
			} as any,
		]);
		computeAppliedMock.mockReturnValue(["width"]);
	});

	it("execute returns success structured with appliedParameterIds", async () => {
		const deps = mockDeps(async () => ({
			success: true as const,
			data: {} as any,
		}));
		const output = await importModelStateTool.execute(
			deps,
			{modelStateId: "ms-1"},
			signal,
		);
		expect(output).toEqual({
			success: true,
			appliedParameterIds: ["width"],
		});
		expect(computeAppliedMock).toHaveBeenCalled();
	});

	it("execute throws when result.success is false", async () => {
		const deps = mockDeps(async () => ({
			success: false as const,
			message: "bad id",
			invalidParameters: [],
		}));
		await expect(
			importModelStateTool.execute(deps, {modelStateId: "x"}, signal),
		).rejects.toBeInstanceOf(ToolExecutionError);
	});

	it("format mentions applied count", () => {
		expect(
			importModelStateTool.format({
				success: true,
				appliedParameterIds: ["a", "b"],
			}),
		).toBe("Imported model state. Applied 2 parameter(s).");
		expect(
			importModelStateTool.format({
				success: true,
				appliedParameterIds: ["a"],
				invalidParameters: [{name: "z", message: "nope"}],
			}),
		).toBe("Imported model state. Applied 1 parameter(s); 1 invalid.");
	});
});
