import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {applyParameterUpdates} from "../lib/resolveSetParameterUpdates";

function param(
	id: string,
	opts: {
		name?: string;
		displayname?: string;
		type?: ResParameterType;
		uiValue?: unknown;
	} = {},
): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id,
			name: opts.name ?? id,
			displayname: opts.displayname,
			type: opts.type ?? ResParameterType.FLOAT,
			hidden: false,
			defval: 0,
			min: 0,
			max: 100,
		},
		state: {uiValue: opts.uiValue ?? 1},
		actions: {isValid: () => true},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<unknown>;
}

const getParametersFor =
	(paramsByNamespace: Record<string, IShapeDiverParameter<unknown>[]>) =>
	(ns: string) =>
		paramsByNamespace[ns] ?? [];

describe("applyParameterUpdates", () => {
	const defaultNamespace = "c";
	let batchUpdate: jest.Mock;

	beforeEach(() => {
		batchUpdate = jest.fn().mockResolvedValue(undefined);
	});

	it("unknown name: error, empty applied, no batch", async () => {
		const name = "missing";
		const result = await applyParameterUpdates(
			defaultNamespace,
			getParametersFor({[defaultNamespace]: [param("width")]}),
			[{name, value: 10}],
			batchUpdate,
		);

		expect(result.applied).toEqual([]);
		expect(result.errors).toEqual([
			{
				name,
				message: `Parameter with id/name/displayname "${name}" does not exist.`,
			},
		]);
		expect(batchUpdate).not.toHaveBeenCalled();
	});

	it("duplicate param id: second update refused", async () => {
		const width = param("width", {name: "Width"});
		const result = await applyParameterUpdates(
			defaultNamespace,
			getParametersFor({[defaultNamespace]: [width]}),
			[
				{name: "Width", value: 20},
				{name: "width", value: 30},
			],
			batchUpdate,
		);

		expect(result.errors).toEqual([
			{
				name: "width",
				message: 'Refusing to update parameter "width" twice.',
			},
		]);
		expect(result.applied).toEqual(["width"]);
		expect(batchUpdate).toHaveBeenCalledTimes(1);
	});

	it("unsupported type: WebMCP error, no batch", async () => {
		const upload = param("file-1", {
			name: "Upload",
			type: ResParameterType.FILE,
		});
		const result = await applyParameterUpdates(
			defaultNamespace,
			getParametersFor({[defaultNamespace]: [upload]}),
			[{name: "Upload", value: "x"}],
			batchUpdate,
		);

		expect(result.applied).toEqual([]);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].name).toBe("Upload");
		expect(result.errors[0].message).toContain(
			"is not supported for setting via agent tools.",
		);
		expect(batchUpdate).not.toHaveBeenCalled();
	});

	it("valid update: batch keyed by namespace and param id", async () => {
		const width = param("width", {name: "Width"});
		const result = await applyParameterUpdates(
			defaultNamespace,
			getParametersFor({[defaultNamespace]: [width]}),
			[{name: "Width", value: 42}],
			batchUpdate,
		);

		expect(result.applied).toContain("width");
		expect(result.errors).toEqual([]);
		expect(batchUpdate).toHaveBeenCalledWith({
			[defaultNamespace]: {width: 42},
		});
	});

	it("mixed valid and invalid: valid applied, errors listed", async () => {
		const width = param("width", {name: "Width"});
		const result = await applyParameterUpdates(
			defaultNamespace,
			getParametersFor({[defaultNamespace]: [width]}),
			[
				{name: "Width", value: 42},
				{name: "missing", value: 1},
			],
			batchUpdate,
		);

		expect(result.applied).toEqual(["width"]);
		expect(result.errors).toEqual([
			{
				name: "missing",
				message:
					'Parameter with id/name/displayname "missing" does not exist.',
			},
		]);
		expect(batchUpdate).toHaveBeenCalledWith({
			[defaultNamespace]: {width: 42},
		});
	});

	it("sessionId uses that namespace getParameters, not default", async () => {
		const defaultParam = param("width", {name: "Width"});
		const otherParam = param("height", {name: "Height"});
		const getParameters = jest.fn((ns: string) => {
			if (ns === defaultNamespace) {
				return [defaultParam];
			}
			if (ns === "other") {
				return [otherParam];
			}
			return [];
		});

		const result = await applyParameterUpdates(
			defaultNamespace,
			getParameters,
			[{name: "Height", sessionId: "other", value: 55}],
			batchUpdate,
		);

		expect(getParameters).toHaveBeenCalledWith("other");
		expect(getParameters).not.toHaveBeenCalledWith(defaultNamespace);
		expect(result.applied).toEqual(["height"]);
		expect(batchUpdate).toHaveBeenCalledWith({
			other: {height: 55},
		});
	});
});
