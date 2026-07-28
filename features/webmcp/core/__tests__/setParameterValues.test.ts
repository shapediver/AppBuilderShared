import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {ToolDeps} from "../deps";
import {setParameterValuesTool} from "../setParameterValues";
import {ToolExecutionError} from "../toolDefinition";

function mockFloat(id: string, name: string): IShapeDiverParameter<any> {
	return {
		definition: {
			id,
			name,
			type: ResParameterType.FLOAT,
			min: 0,
			max: 100,
			defval: 10,
		},
		state: {
			uiValue: 10,
			execValue: 10,
			dirty: false,
			disableOtherParameters: false,
			stringExecValue: () => "",
		},
		actions: {
			setUiValue: () => true,
			setUiAndExecValue: () => true,
			execute: async () => "",
			isValid: () => true,
			isUiValueDifferent: () => false,
			resetToDefaultValue: () => undefined,
			resetToExecValue: () => undefined,
		},
		acceptRejectMode: false,
	} as IShapeDiverParameter<any>;
}

function mockDeps(params: IShapeDiverParameter<any>[]): ToolDeps {
	return {
		namespace: "session-1",
		getLiveParameters: (ns) => (ns === "session-1" ? params : []),
		listParameterNamespaces: () => ["session-1"],
		batchParameterValueUpdate: jest.fn().mockResolvedValue(undefined),
		createModelState: jest.fn(),
		importModelState: jest.fn(),
	};
}

describe("setParameterValuesTool", () => {
	const signal = new AbortController().signal;

	it("execute applies valid updates", async () => {
		const deps = mockDeps([mockFloat("width", "Width")]);
		const output = await setParameterValuesTool.execute(
			deps,
			{updates: [{name: "Width", value: 42}]},
			signal,
		);
		expect(output).toEqual({applied: ["width"], errors: []});
		expect(deps.batchParameterValueUpdate).toHaveBeenCalled();
	});

	it("execute returns partial failure without throwing", async () => {
		const deps = mockDeps([mockFloat("width", "Width")]);
		const output = await setParameterValuesTool.execute(
			deps,
			{
				updates: [
					{name: "Width", value: 42},
					{name: "Missing", value: 1},
				],
			},
			signal,
		);
		expect(output.applied).toEqual(["width"]);
		expect(output.errors).toHaveLength(1);
		expect(output.errors[0].name).toBe("Missing");
	});

	it("execute throws ToolExecutionError on total failure", async () => {
		const deps = mockDeps([mockFloat("width", "Width")]);
		await expect(
			setParameterValuesTool.execute(
				deps,
				{updates: [{name: "Missing", value: 1}]},
				signal,
			),
		).rejects.toBeInstanceOf(ToolExecutionError);

		try {
			await setParameterValuesTool.execute(
				deps,
				{updates: [{name: "Missing", value: 1}]},
				signal,
			);
		} catch (e) {
			const err = e as ToolExecutionError;
			expect(err.message).toContain("Applied 0 of 1 updates");
			expect(err.structuredContent).toEqual({
				applied: [],
				errors: [
					{
						name: "Missing",
						message:
							'Parameter with id/name/displayname "Missing" does not exist.',
					},
				],
			});
		}
	});

	it("format mentions applied and failed counts", () => {
		expect(
			setParameterValuesTool.format({
				applied: ["width"],
				errors: [{name: "x", message: "y"}],
			}),
		).toBe("Applied 1 of 2 updates. 1 failed.");
		expect(
			setParameterValuesTool.format({applied: ["width"], errors: []}),
		).toBe("Applied 1 of 1 updates.");
	});
});
