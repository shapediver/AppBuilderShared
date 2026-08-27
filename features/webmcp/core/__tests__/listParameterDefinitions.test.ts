import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {ToolDeps} from "../deps";
import {listParameterDefinitionsTool} from "../listParameterDefinitions";

function mockParam(
	id: string,
	name: string,
	hidden = false,
): IShapeDiverParameter<any> {
	return {
		definition: {
			id,
			name,
			type: ResParameterType.FLOAT,
			hidden,
			min: 0,
			max: 10,
			defval: 1,
		},
		state: {
			uiValue: 1,
			execValue: 1,
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

function mockDeps(
	paramsByNs: Record<string, IShapeDiverParameter<any>[]>,
): ToolDeps {
	return {
		namespace: "main",
		getLiveParameters: (ns) => paramsByNs[ns] ?? [],
		listParameterNamespaces: () => Object.keys(paramsByNs),
		batchParameterValueUpdate: jest.fn(),
		createModelState: jest.fn(),
		importModelState: jest.fn(),
	};
}

describe("listParameterDefinitionsTool", () => {
	const signal = new AbortController().signal;

	it("execute filters by search, paginates, and sets truncated", async () => {
		const deps = mockDeps({
			main: [
				mockParam("width", "Width"),
				mockParam("height", "Height"),
				mockParam("depth", "Depth"),
			],
		});
		const page1 = await listParameterDefinitionsTool.execute(
			deps,
			{search: "d", limit: 1, offset: 0},
			signal,
		);
		expect(page1.parameters).toHaveLength(1);
		expect(page1.truncated).toBe(true);
		expect(page1.remaining).toBe(1);
		expect(page1.nextOffset).toBe(1);

		const page2 = await listParameterDefinitionsTool.execute(
			deps,
			{search: "d", limit: 1, offset: 1},
			signal,
		);
		expect(page2.parameters).toHaveLength(1);
		expect(page2.truncated).toBeUndefined();
	});

	it("execute throws on invalid sessionId", async () => {
		const deps = mockDeps({main: [mockParam("width", "Width")]});
		await expect(
			listParameterDefinitionsTool.execute(
				deps,
				{sessionId: "missing"},
				signal,
			),
		).rejects.toThrow(/Session "missing" does not exist/);
	});

	it("execute respects filter=visible", async () => {
		const deps = mockDeps({
			main: [
				mockParam("width", "Width", false),
				mockParam("secret", "Secret", true),
			],
		});
		const output = await listParameterDefinitionsTool.execute(
			deps,
			{filter: "visible"},
			signal,
		);
		expect(output.parameters.map((p) => p.id)).toEqual(["width"]);
	});

	it("format ports non-truncated and truncated messages", () => {
		expect(
			listParameterDefinitionsTool.format({
				parameters: [{id: "a"} as any],
				sessionCount: 1,
				offset: 0,
			}),
		).toBe(
			"Found 1 parameter definitions for 1 sessions. Use set_parameter_values to update the state of parameters.",
		);

		expect(
			listParameterDefinitionsTool.format({
				parameters: [{id: "a"} as any, {id: "b"} as any],
				truncated: true,
				sessionCount: 1,
				offset: 0,
				remaining: 3,
				nextOffset: 2,
			}),
		).toBe(
			"Found 2 parameter definitions for 1 sessions (page starting at offset 0; 3 more remain). Use set_parameter_values to update the state of parameters. More parameters match beyond this page. Raise offset (e.g. offset=2) or narrow your search.",
		);
	});

	it("surfaces choiceMetadata from getChoiceMetadata for STRINGLIST", async () => {
		const stringListParam = {
			...mockParam("material", "Material"),
			definition: {
				id: "material",
				name: "Material",
				type: ResParameterType.STRINGLIST,
				choices: ["Apple"],
				defval: 0,
				hidden: false,
			},
			state: {
				uiValue: 0,
				execValue: 0,
				dirty: false,
				disableOtherParameters: false,
				stringExecValue: () => "",
			},
		} as IShapeDiverParameter<any>;

		const metadata = {
			Apple: {
				description: "Crisp",
				displayname: "Apples",
				imageUrl: "http://x/a.jpg",
			},
		};
		const deps = {
			...mockDeps({main: [stringListParam]}),
			getChoiceMetadata: () => metadata,
		};

		const output = await listParameterDefinitionsTool.execute(
			deps,
			{},
			signal,
		);
		expect(output.parameters[0].choiceMetadata).toEqual(metadata);
	});

	it("search matches name when id and displayname do not", async () => {
		const deps = mockDeps({main: [mockParam("p1", "Width")]});
		const output = await listParameterDefinitionsTool.execute(
			deps,
			{search: "wid"},
			signal,
		);
		expect(output.parameters.map((p) => p.id)).toEqual(["p1"]);
	});

	it("search matches id when name and displayname do not", async () => {
		const deps = mockDeps({main: [mockParam("abc-id", "Width")]});
		const output = await listParameterDefinitionsTool.execute(
			deps,
			{search: "abc"},
			signal,
		);
		expect(output.parameters.map((p) => p.id)).toEqual(["abc-id"]);
	});

	it("search matches displayname when id and name do not", async () => {
		const param = mockParam("p1", "internal");
		param.definition.displayname = "ShownLabel";
		const deps = mockDeps({main: [param]});
		const output = await listParameterDefinitionsTool.execute(
			deps,
			{search: "shown"},
			signal,
		);
		expect(output.parameters.map((p) => p.id)).toEqual(["p1"]);
	});

	it("search trims whitespace", async () => {
		const deps = mockDeps({main: [mockParam("width", "Width")]});
		const output = await listParameterDefinitionsTool.execute(
			deps,
			{search: "  Width  "},
			signal,
		);
		expect(output.parameters.map((p) => p.id)).toEqual(["width"]);
	});

	it("paginates remaining from a non-zero offset", async () => {
		const deps = mockDeps({
			main: [
				mockParam("p0", "P0"),
				mockParam("p1", "P1"),
				mockParam("p2", "P2"),
				mockParam("p3", "P3"),
			],
		});
		const page = await listParameterDefinitionsTool.execute(
			deps,
			{search: "p", limit: 1, offset: 1},
			signal,
		);
		expect(page.parameters).toHaveLength(1);
		expect(page.truncated).toBe(true);
		expect(page.remaining).toBe(2);
		expect(page.nextOffset).toBe(2);
	});

	it("lists only the requested sessionId", async () => {
		const deps = mockDeps({
			main: [mockParam("width", "Width")],
			other: [mockParam("height", "Height")],
		});
		const output = await listParameterDefinitionsTool.execute(
			deps,
			{sessionId: "other"},
			signal,
		);
		expect(output.parameters.map((p) => p.id)).toEqual(["height"]);
		expect(output.sessionCount).toBe(1);
	});

	it("declares read-only untrusted annotations", () => {
		expect(listParameterDefinitionsTool.annotations).toEqual({
			readOnlyHint: true,
			untrustedContentHint: true,
		});
	});
});
