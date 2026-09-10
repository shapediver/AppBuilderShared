import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {GenericToolName} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {defaultSettingsFor} from "../../config/inScopeGenericTools";
import type {AgentToolsDeps} from "../../model/agentToolsDeps";
import {handleListParameterDefinitions} from "../../model/handlers/listParameterDefinitions";

const listSettings = defaultSettingsFor(
	GenericToolName.ListParameterDefinitions,
);

function param(id: string): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id,
			name: id,
			type: ResParameterType.FLOAT,
			hidden: false,
			defval: 0,
			min: 0,
			max: 100,
		},
		state: {uiValue: 1},
		actions: {},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<unknown>;
}

function createDeps(
	paramsByNamespace: Record<string, IShapeDiverParameter<unknown>[]>,
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
	};
}

describe("handleListParameterDefinitions namespace", () => {
	it("includes controller session namespace on each item", async () => {
		const result = await handleListParameterDefinitions(
			{},
			listSettings,
			createDeps({c: [param("width")]}),
		);

		expect(result.parameters).toEqual([
			expect.objectContaining({id: "width", namespace: "c"}),
		]);
	});

	it("uses sessionId from parameters refs as namespace", async () => {
		const result = await handleListParameterDefinitions(
			{},
			{
				name: "list_parameter_definitions",
				parameters: [{name: "p", sessionId: "other"}],
			},
			createDeps({c: [], other: [param("p")]}),
		);

		expect(result.parameters).toEqual([
			expect.objectContaining({id: "p", namespace: "other"}),
		]);
	});
});
