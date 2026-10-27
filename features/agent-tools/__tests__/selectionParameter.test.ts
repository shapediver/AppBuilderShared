import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {GenericToolName} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {defaultSettingsFor} from "../config/inScopeGenericTools";
import {parameterValueSchema} from "../config/listParameterDefinitions";
import {setParameterValuesInputSchema} from "../config/setParameterValues";
import {mapParameterDefinition} from "../lib/parameterDefinitionMapper";
import {
	isAgentSettableParameter,
	parameterTypeKey,
} from "../lib/parameterTypeKey";
import {applyParameterUpdates} from "../lib/resolveSetParameterUpdates";
import {
	getSelectionSettings,
	parseSelectionValue,
} from "../lib/selectionParameter";
import {prepareParameterStoreValue} from "../lib/setParameterValueValidators/prepareParameterStoreValue";
import {zodToJsonSchema} from "../lib/zodToJsonSchema";
import type {AgentToolsDeps} from "../model/agentToolsDeps";
import {handleGetParameterValues} from "../model/handlers/getParameterValues";
import {handleSetParameterValues} from "../model/handlers/setParameterValues";

const SELECTABLE = ["Shapes.box", "Shapes.sphere", "Shapes.cone"];

function selectionParam(
	opts: {
		id?: string;
		props?: Record<string, unknown>;
		uiValue?: string;
		defval?: string;
	} = {},
): IShapeDiverParameter<string> {
	return {
		definition: {
			id: opts.id ?? "sel",
			name: opts.id ?? "sel",
			type: ResParameterType.INTERACTION,
			hidden: false,
			defval: opts.defval ?? '{"names":[]}',
			settings: {
				type: "selection",
				props: {nameFilter: ["Shapes.*"], ...opts.props},
			},
		},
		state: {uiValue: opts.uiValue ?? '{"names":[]}'},
		actions: {isValid: () => true},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<string>;
}

function gumballParam(): IShapeDiverParameter<string> {
	return {
		definition: {
			id: "gum",
			name: "gum",
			type: ResParameterType.INTERACTION,
			defval: "",
			settings: {type: "gumball", props: {nameFilter: ["Shapes.*"]}},
		},
		state: {uiValue: ""},
		actions: {isValid: () => true},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<string>;
}

function floatParam(): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id: "width",
			name: "width",
			type: ResParameterType.FLOAT,
			defval: 1,
			min: 0,
			max: 10,
		},
		state: {uiValue: 1},
		actions: {isValid: () => true},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<unknown>;
}

const context = {getAvailableNodes: () => SELECTABLE};

function createDeps(
	parameters: IShapeDiverParameter<any>[],
	overrides: Partial<AgentToolsDeps> = {},
): AgentToolsDeps {
	return {
		controllerNamespace: "c",
		getLiveParameters: (namespace) => (namespace === "c" ? parameters : []),
		listSessionNamespaces: () => ["c"],
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
		getCamera: () => undefined,
		getScreenshot: async () => undefined,
		getAvailableNodes: jest.fn(() => SELECTABLE),
		getOutputByName: () => undefined,
		...overrides,
	};
}

describe("selection parameter helpers", () => {
	it("leaves nothing selectable for invalid settings, like the selection UI", () => {
		expect(
			getSelectionSettings(
				selectionParam({props: {minimumSelection: "two"}}).definition,
			),
		).toEqual({nameFilter: [], minimumSelection: 1, maximumSelection: 1});
	});

	it("applies the selection UI defaults", () => {
		expect(getSelectionSettings(selectionParam().definition)).toEqual({
			nameFilter: ["Shapes.*"],
			minimumSelection: 1,
			maximumSelection: 1,
		});
	});

	it("keys parameter types by type and subtype", () => {
		expect(parameterTypeKey(selectionParam().definition)).toBe(
			"Interaction.selection",
		);
		expect(parameterTypeKey(gumballParam().definition)).toBe(
			"Interaction.gumball",
		);
		expect(parameterTypeKey(floatParam().definition)).toBe("Float");
	});

	it("treats only selection interaction parameters as settable", () => {
		expect(isAgentSettableParameter(selectionParam().definition)).toBe(
			true,
		);
		expect(isAgentSettableParameter(gumballParam().definition)).toBe(false);
		expect(getSelectionSettings(gumballParam().definition)).toBeUndefined();
		expect(isAgentSettableParameter(floatParam().definition)).toBe(true);
	});

	it("accepts {names} objects in the value schema", () => {
		expect(parameterValueSchema.safeParse({names: ["a"]}).success).toBe(
			true,
		);
		expect(parameterValueSchema.safeParse({names: [1]}).success).toBe(
			false,
		);
		expect(parameterValueSchema.safeParse(["a"]).success).toBe(false);
	});

	it("parses {names} objects and their JSON string", () => {
		expect(parseSelectionValue({names: ["a"]})).toEqual(["a"]);
		expect(parseSelectionValue('{"names":["a"]}')).toEqual(["a"]);
		expect(parseSelectionValue("a")).toBeUndefined();
		expect(parseSelectionValue(["a"])).toBeUndefined();
		expect(parseSelectionValue({names: "a"})).toBeUndefined();
	});
});

describe("mapParameterDefinition (selection)", () => {
	it("exposes count limits and names, not the selectable names", () => {
		const item = mapParameterDefinition(
			selectionParam({
				props: {minimumSelection: 0, maximumSelection: 2},
				uiValue: '{"names":["Shapes.box"]}',
			}),
		);
		expect(item).toEqual({
			id: "sel",
			name: "sel",
			type: ResParameterType.INTERACTION,
			settable: true,
			hidden: false,
			settings: {
				type: "selection",
				props: {minimumSelection: 0, maximumSelection: 2},
			},
			currentValue: {names: ["Shapes.box"]},
			defaultValue: {names: []},
		});
	});

	it("keeps other interaction parameters read-only", () => {
		const item = mapParameterDefinition(gumballParam());
		expect(item.settable).toBe(false);
		expect(item.settings).toBeUndefined();
		expect(item.currentValue).toBeUndefined();
	});
});

describe("prepareParameterStoreValue (selection)", () => {
	it("serializes valid names like the selection UI", () => {
		expect(
			prepareParameterStoreValue(
				selectionParam(),
				{names: ["Shapes.box"]},
				context,
			),
		).toEqual({success: true, storeValue: '{"names":["Shapes.box"]}'});
	});

	it("accepts the stored JSON string format", () => {
		expect(
			prepareParameterStoreValue(
				selectionParam(),
				'{"names":["Shapes.box"]}',
				context,
			),
		).toEqual({success: true, storeValue: '{"names":["Shapes.box"]}'});
	});

	it("rejects other values with a hint", () => {
		const result = prepareParameterStoreValue(
			selectionParam(),
			"Shapes.box",
			context,
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.message).toMatch(
				/Use \{names: \[\.\.\.\]\} with 1 unique node names/,
			);
			expect(result.message).toMatch(/get_parameter_values/);
		}
	});

	it("respects minimumSelection and maximumSelection", () => {
		const param = selectionParam({
			props: {minimumSelection: 1, maximumSelection: 2},
		});
		const tooMany = prepareParameterStoreValue(
			param,
			{names: SELECTABLE},
			context,
		);
		expect(tooMany.success).toBe(false);
		if (!tooMany.success) {
			expect(tooMany.message).toMatch(/requires 1 to 2 .* got 3/);
		}
		expect(
			prepareParameterStoreValue(param, {names: []}, context).success,
		).toBe(false);
		expect(
			prepareParameterStoreValue(
				selectionParam({props: {minimumSelection: 0}}),
				{names: []},
				context,
			),
		).toEqual({success: true, storeValue: '{"names":[]}'});
	});

	it("rejects duplicate names", () => {
		const result = prepareParameterStoreValue(
			selectionParam({props: {maximumSelection: 3}}),
			{names: ["Shapes.box", "Shapes.box"]},
			context,
		);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.message).toMatch(/duplicate/);
	});

	it("rejects names not matching the nameFilter and lists the selectable ones", () => {
		const getAvailableNodes = jest.fn(() => SELECTABLE);
		const result = prepareParameterStoreValue(
			selectionParam(),
			{names: ["Other.thing"]},
			{getAvailableNodes},
		);
		expect(getAvailableNodes).toHaveBeenCalledWith(["Shapes.*"]);
		expect(result).toEqual({
			success: false,
			message: `Node names ["Other.thing"] are not selectable for parameter "sel". Available nodes: ${JSON.stringify(SELECTABLE)}.`,
		});
	});

	it("treats the empty string as an empty selection", () => {
		expect(parseSelectionValue("")).toEqual([]);
		expect(
			prepareParameterStoreValue(
				selectionParam({props: {minimumSelection: 0}}),
				"",
				context,
			),
		).toEqual({success: true, storeValue: '{"names":[]}'});
	});

	it("rejects malformed JSON strings", () => {
		expect(parseSelectionValue('{"names":')).toBeUndefined();
		expect(
			prepareParameterStoreValue(selectionParam(), '{"names":', context)
				.success,
		).toBe(false);
	});

	it("rejects selection values for non-selection parameters", () => {
		const result = prepareParameterStoreValue(
			floatParam(),
			{names: ["a"]},
			context,
		);
		expect(result).toEqual({
			success: false,
			message:
				"Selection value {names} is only valid for selection parameters.",
		});
	});
});

describe("set_parameter_values (selection)", () => {
	it("writes the serialized selection", async () => {
		const deps = createDeps([selectionParam()]);
		const result = await handleSetParameterValues(
			{updates: [{name: "sel", value: {names: ["Shapes.cone"]}}]},
			deps,
		);
		expect(result).toEqual({applied: ["sel"], errors: []});
		expect(deps.batchParameterValueUpdate).toHaveBeenCalledWith({
			c: {sel: '{"names":["Shapes.cone"]}'},
		});
	});

	it("accepts stored string values (setParameterValues actions)", async () => {
		const batchUpdate = jest.fn().mockResolvedValue(undefined);
		const result = await applyParameterUpdates(
			"c",
			() => [selectionParam()],
			[{name: "sel", value: '{"names":["Shapes.box"]}'}],
			batchUpdate,
			undefined,
			context,
		);
		expect(result).toEqual({applied: ["sel"], errors: []});
		expect(batchUpdate).toHaveBeenCalledWith({
			c: {sel: '{"names":["Shapes.box"]}'},
		});
	});

	it("routes updates with sessionId to that namespace", async () => {
		const deps = createDeps([], {
			getLiveParameters: (namespace) =>
				namespace === "other" ? [selectionParam()] : [],
		});
		const result = await handleSetParameterValues(
			{
				updates: [
					{
						name: "sel",
						sessionId: "other",
						value: {names: ["Shapes.box"]},
					},
				],
			},
			deps,
		);
		expect(result).toEqual({applied: ["sel"], errors: []});
		expect(deps.batchParameterValueUpdate).toHaveBeenCalledWith({
			other: {sel: '{"names":["Shapes.box"]}'},
		});
	});

	it("writes nothing in complete mode when a selection is invalid", async () => {
		const batchUpdate = jest.fn().mockResolvedValue(undefined);
		const result = await applyParameterUpdates(
			"c",
			() => [selectionParam(), floatParam()],
			[
				{name: "width", value: 2},
				{name: "sel", value: {names: ["Other.thing"]}},
			],
			batchUpdate,
			"complete",
			context,
		);
		expect(result.applied).toEqual([]);
		expect(result.errors).toHaveLength(1);
		expect(batchUpdate).not.toHaveBeenCalled();
	});

	it("refuses other interaction parameters", async () => {
		const result = await applyParameterUpdates(
			"c",
			() => [gumballParam()],
			[{name: "gum", value: {names: ["Shapes.box"]}}],
			jest.fn(),
			{getAvailableNodes: undefined},
		);
		expect(result.errors[0].message).toMatch(/not supported/);
	});
});

describe("get_parameter_values (selection)", () => {
	const settings = defaultSettingsFor(
		GenericToolName.ListParameterDefinitions,
	);

	it("adds selection props to selection parameters only", async () => {
		const deps = createDeps([
			selectionParam({uiValue: '{"names":["Shapes.box"]}'}),
			floatParam(),
		]);
		const result = await handleGetParameterValues({}, settings, deps);
		expect(result.values).toEqual([
			{
				id: "sel",
				name: "sel",
				namespace: "c",
				currentValue: {names: ["Shapes.box"]},
				props: {
					type: ResParameterType.INTERACTION,
					settings: {type: "selection"},
					availableNodes: SELECTABLE,
				},
			},
			{id: "width", name: "width", namespace: "c", currentValue: 1},
		]);
		expect(deps.getAvailableNodes).toHaveBeenCalledTimes(1);
		expect(deps.getAvailableNodes).toHaveBeenCalledWith(["Shapes.*"]);
	});

	it("adds the selectable names when reading by name", async () => {
		const deps = createDeps([selectionParam()]);
		const result = await handleGetParameterValues(
			{names: ["sel"]},
			settings,
			deps,
		);
		expect(result.values[0].props?.availableNodes).toEqual(SELECTABLE);
	});
});

describe("set_parameter_values input schema (selection)", () => {
	it("lists the {names} value and keeps the field descriptions", () => {
		const schema = zodToJsonSchema(setParameterValuesInputSchema);
		const updates = schema.properties!.updates;
		expect(updates.description).toMatch(/Required array of changes/);
		const item = updates.items!;
		expect(item.properties!.sessionId.description).toMatch(
			/session namespace/,
		);
		const value = item.properties!.value;
		expect(value.description).toMatch(/Selection: \{names: \[\.\.\.\]\}/);
		expect(value.anyOf).toContainEqual({
			type: "object",
			properties: {names: {type: "array", items: {type: "string"}}},
			required: ["names"],
			additionalProperties: false,
		});
	});
});
