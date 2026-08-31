jest.mock("@shapediver/viewer.session", () => ({
	PARAMETER_TYPE: {
		Bool: "Bool",
		Float: "Float",
		String: "String",
		StringList: "StringList",
		File: "File",
		Color: "Color",
		Int: "Int",
		Even: "Even",
		Odd: "Odd",
		Drawing: "Drawing",
		Interaction: "Interaction",
	},
	PARAMETER_VISUALIZATION: {
		SLIDER: "slider",
	},
	TAG3D_JUSTIFICATION: {
		LEFT: "left",
		CENTER: "center",
		RIGHT: "right",
	},
}));

jest.mock("@shapediver/viewer.shared.types", () => ({
	ATTRIBUTE_VISUALIZATION: {
		LINEAR: "linear",
	},
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import {
	validateAppBuilder,
	validateAppBuilderSettingsJson,
} from "../appbuildertypecheck";

const layout = (agents?: unknown) => ({
	version: "1.0" as const,
	containers: [],
	...(agents === undefined ? {} : {agents}),
});

const validAgent = {
	id: "configurator",
	name: "Configurator",
	message: "Help the user configure the product.",
};

describe("IAppBuilder.agents schema", () => {
	it("accepts a layout with no agents property", () => {
		expect(validateAppBuilder(layout()).success).toBe(true);
	});

	it("accepts a well-formed agent", () => {
		const result = validateAppBuilder(layout([validAgent]));
		expect(result.success).toBe(true);
	});

	it("rejects an agent missing required message", () => {
		const result = validateAppBuilder(layout([{id: "a", name: "A"}]));
		expect(result.success).toBe(false);
	});

	it("rejects unknown keys on an agent", () => {
		const result = validateAppBuilder(
			layout([{...validAgent, extra: true}]),
		);
		expect(result.success).toBe(false);
	});

	it("rejects agents that are not an array", () => {
		const result = validateAppBuilder(layout(validAgent));
		expect(result.success).toBe(false);
	});

	it("accepts generic tool settings including list_parameter_definitions filters", () => {
		const result = validateAppBuilder(
			layout([
				{
					...validAgent,
					useGenericToolDefaults: false,
					genericTools: [
						{name: "get_screenshot"},
						{
							name: "list_parameter_definitions",
							parameters: [
								{
									name: "Length",
									sessionId: "controller",
									description: "Product length",
								},
							],
							filter: {
								hidden: "exclude",
								invisible: "include",
								sessionIds: ["controller"],
							},
						},
					],
				},
			]),
		);
		expect(result.success).toBe(true);
	});

	it("rejects an unknown generic tool name", () => {
		const result = validateAppBuilder(
			layout([
				{
					...validAgent,
					genericTools: [{name: "not_a_tool"}],
				},
			]),
		);
		expect(result.success).toBe(false);
	});

	it("accepts specific tools with a JSON Schema inputSchema", () => {
		const result = validateAppBuilder(
			layout([
				{
					...validAgent,
					specificTools: [
						{
							name: "apply_preset",
							description: "Apply a named preset",
							inputSchema: {
								type: "object",
								properties: {
									preset: {type: "string"},
								},
							},
							actionSequence: [
								{
									type: "closeConfigurator",
									props: {},
								},
							],
						},
					],
				},
			]),
		);
		expect(result.success).toBe(true);
	});

	it("rejects a specific tool missing inputSchema", () => {
		const result = validateAppBuilder(
			layout([
				{
					...validAgent,
					specificTools: [{name: "apply_preset"}],
				},
			]),
		);
		expect(result.success).toBe(false);
	});

	it("accepts a specific-tool actionSequence that maps input via agentTool", () => {
		const result = validateAppBuilder(
			layout([
				{
					...validAgent,
					specificTools: [
						{
							name: "set_length",
							inputSchema: {
								type: "object",
								properties: {length: {type: "number"}},
							},
							actionSequence: [
								{
									type: "setParameterValue",
									props: {
										parameter: {name: "Length"},
										source: {
											type: "agentTool",
											props: {jsonPath: "$.length"},
										},
									},
								},
							],
						},
					],
				},
			]),
		);
		expect(result.success).toBe(true);
	});

	it("accepts list_action_controls with an embedded action that has id", () => {
		const result = validateAppBuilder(
			layout([
				{
					...validAgent,
					genericTools: [
						{
							name: "list_action_controls",
							actions: [
								{
									name: "save",
									description:
										"Save the current configuration",
									action: {
										id: "save-state",
										label: "Save",
										definition: {
											type: "createModelState",
											props: {},
										},
									},
								},
							],
							filter: {types: ["createModelState", "addToCart"]},
						},
					],
				},
			]),
		);
		expect(result.success).toBe(true);
	});

	it("rejects an embedded action control without id", () => {
		const result = validateAppBuilder(
			layout([
				{
					...validAgent,
					genericTools: [
						{
							name: "list_action_controls",
							actions: [
								{
									action: {
										definition: {
											type: "closeConfigurator",
											props: {},
										},
									},
								},
							],
						},
					],
				},
			]),
		);
		expect(result.success).toBe(false);
	});
});

describe("appBuilderOverride.agents", () => {
	it("accepts agents on settings appBuilderOverride", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			appBuilderOverride: layout([validAgent]),
		});
		expect(result.success).toBe(true);
	});
});
