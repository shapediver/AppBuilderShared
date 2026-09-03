import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {
	GenericToolName,
	type ListParameterDefinitionsToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {defaultSettingsFor} from "../../config/inScopeGenericTools";
import type {AgentToolsDeps} from "../../model/agentToolsDeps";
import {handleGetParameterValues} from "../../model/handlers/getParameterValues";

const listSettings = defaultSettingsFor(
	GenericToolName.ListParameterDefinitions,
);

const bothSessionsSettings: ListParameterDefinitionsToolSettings = {
	name: "list_parameter_definitions",
	filter: {sessionIds: ["c", "other"]},
};

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

describe("handleGetParameterValues namespace", () => {
	it("returns all agent-filtered params with namespace when namespace is omitted", async () => {
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

	it("keeps only matching namespace after agent filtering", async () => {
		const deps = createDeps({
			c: [param("width", {uiValue: 42})],
			other: [
				param("height", {uiValue: 7}),
				param("secret", {hidden: true, uiValue: 99}),
			],
		});

		const excluded = await handleGetParameterValues(
			{namespace: "other"},
			bothSessionsSettings,
			deps,
		);
		expect(excluded.values).toEqual([
			{id: "height", name: "height", namespace: "other", currentValue: 7},
		]);

		const included = await handleGetParameterValues(
			{namespace: "other"},
			{
				name: "list_parameter_definitions",
				filter: {sessionIds: ["c", "other"], hidden: "include"},
			},
			deps,
		);
		expect(included.values.map((v) => v.id)).toEqual(["height", "secret"]);
		expect(included.values.every((v) => v.namespace === "other")).toBe(
			true,
		);
	});

	it("returns empty values when namespace matches no live parameters", async () => {
		const result = await handleGetParameterValues(
			{namespace: "missing"},
			bothSessionsSettings,
			createDeps({
				c: [param("width", {uiValue: 42})],
				other: [param("height", {uiValue: 7})],
			}),
		);

		expect(result.values).toEqual([]);
		expect(result.errors).toBeUndefined();
	});

	it("errors unknown names and returns hits with id, name, displayname, namespace, currentValue", async () => {
		const result = await handleGetParameterValues(
			{names: ["Width", "missing"]},
			listSettings,
			createDeps({
				c: [
					param("width", {
						name: "width_name",
						displayname: "Width",
						uiValue: 42,
					}),
				],
			}),
		);

		expect(result.values).toEqual([
			{
				id: "width",
				name: "width_name",
				displayname: "Width",
				namespace: "c",
				currentValue: 42,
			},
		]);
		expect(result.errors).toEqual([
			expect.objectContaining({name: "missing"}),
		]);
	});

	it("returns input error named * when extra keys are present", async () => {
		const result = await handleGetParameterValues(
			{filter: "visible"},
			listSettings,
			createDeps({c: [param("width")]}),
		);

		expect(result.values).toEqual([]);
		expect(result.errors?.[0]?.name).toBe("*");
	});
});
