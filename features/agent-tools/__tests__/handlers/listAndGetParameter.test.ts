import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {ListParameterDefinitionsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {defaultSettingsFor, InScopeGenericToolName} from "../../config/inScopeGenericTools";
import type {AgentToolsDeps} from "../../model/agentToolsDeps";
import {handleGetParameterValues} from "../../model/handlers/getParameterValues";
import {handleListParameterDefinitions} from "../../model/handlers/listParameterDefinitions";

const listSettings = defaultSettingsFor(
	InScopeGenericToolName.ListParameterDefinitions,
) as ListParameterDefinitionsToolSettings;

function param(
	id: string,
	opts: {
		hidden?: boolean;
		name?: string;
		displayname?: string;
		uiValue?: unknown;
		type?: ResParameterType;
	} = {},
): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id,
			name: opts.name ?? id,
			displayname: opts.displayname,
			type: opts.type ?? ResParameterType.FLOAT,
			hidden: opts.hidden ?? false,
			defval: 0,
			min: 0,
			max: 100,
		},
		state: {uiValue: opts.uiValue ?? 1},
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

describe("handleListParameterDefinitions", () => {
	it("returns input error named * when extra keys are present", async () => {
		const result = await handleListParameterDefinitions(
			{filter: "visible"},
			listSettings,
			createDeps({c: [param("width")]}),
		);

		expect(result.parameters).toEqual([]);
		expect(result.errors?.[0]?.name).toBe("*");
	});

	it("uses agent hidden filter, not tool input", async () => {
		const deps = createDeps({
			c: [param("width"), param("secret", {hidden: true})],
		});

		const listed = await handleListParameterDefinitions(
			{},
			listSettings,
			deps,
		);
		expect(listed.parameters.map((p) => p.id)).toEqual(["width"]);

		const withHidden = await handleListParameterDefinitions(
			{},
			{name: "list_parameter_definitions", filter: {hidden: "include"}},
			deps,
		);
		expect(withHidden.parameters.map((p) => p.id)).toEqual([
			"width",
			"secret",
		]);
	});

	it("resolves explicit parameter refs from their sessionId, ignoring filter", async () => {
		const deps = createDeps({
			c: [],
			other: [param("p")],
		});

		const withSessionId = await handleListParameterDefinitions(
			{},
			{
				name: "list_parameter_definitions",
				parameters: [{name: "p", sessionId: "other"}],
			},
			deps,
		);
		expect(withSessionId.parameters.map((p) => p.id)).toEqual(["p"]);

		const withoutSessionId = await handleListParameterDefinitions(
			{},
			{
				name: "list_parameter_definitions",
				parameters: [{name: "p"}],
			},
			deps,
		);
		expect(withoutSessionId.parameters).toEqual([]);
	});
});

describe("handleGetParameterValues", () => {
	it("returns currentValue for the filtered set when names are omitted", async () => {
		const result = await handleGetParameterValues(
			{},
			listSettings,
			createDeps({
				c: [
					param("width", {uiValue: 42}),
					param("secret", {hidden: true, uiValue: 99}),
				],
			}),
		);

		expect(result.values).toEqual([
			{id: "width", name: "width", namespace: "c", currentValue: 42},
		]);
		expect(result.errors).toBeUndefined();
	});

	it("adds an error for unknown names and still returns other values", async () => {
		const result = await handleGetParameterValues(
			{names: ["width", "missing"]},
			listSettings,
			createDeps({c: [param("width", {uiValue: 42})]}),
		);

		expect(result.values).toEqual([
			{id: "width", name: "width", namespace: "c", currentValue: 42},
		]);
		expect(result.errors).toEqual([
			expect.objectContaining({name: "missing"}),
		]);
	});
});
