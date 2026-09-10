import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import type {AgentToolsDeps} from "../model/agentToolsDeps";
import {collectFilteredParameters} from "../model/collectFilteredParameters";

function param(id: string): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id,
			name: id,
			type: ResParameterType.FLOAT,
			hidden: false,
		},
		state: {uiValue: 1},
		actions: {},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<unknown>;
}

function createDeps(
	paramsByNamespace: Record<string, IShapeDiverParameter<unknown>[]>,
	overrides: Partial<AgentToolsDeps> = {},
): AgentToolsDeps {
	const controllerNamespace = "c";
	return {
		controllerNamespace,
		getLiveParameters: (namespace) => paramsByNamespace[namespace] ?? [],
		listSessionNamespaces: () => Object.keys(paramsByNamespace),
		getAppBuilder: () => ({version: "1.0", containers: []}),
		batchParameterValueUpdate: jest.fn().mockResolvedValue(undefined),
		getDefaultToolbarActions: () => [],
		createModelState: async () => ({success: true}),
		importModelState: async () => ({success: true}),
		undo: async () => ({success: true}),
		redo: async () => ({success: true}),
		resetParameters: async () => ({success: true}),
		getViewportId: () => "vp",
		setCamera: async () => ({success: true}),
		getScreenshot: async () => undefined,
		getOutputByName: () => undefined,
		...overrides,
	};
}

describe("collectFilteredParameters", () => {
	it("returns empty when settings.parameters is empty even if live params exist", () => {
		const live = [param("width")];
		const getLiveParameters = jest.fn((namespace: string) =>
			namespace === "c" ? live : [],
		);
		const deps = createDeps({c: live}, {getLiveParameters});

		const omitted = collectFilteredParameters(
			{name: "list_parameter_definitions"},
			deps,
		);
		expect(omitted).toHaveLength(1);
		expect(omitted[0]?.parameter.definition.id).toBe("width");

		const emptyList = collectFilteredParameters(
			{name: "list_parameter_definitions", parameters: []},
			deps,
		);
		expect(emptyList).toEqual([]);
	});
});
