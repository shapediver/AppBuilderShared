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

/** SS-9065-shaped appBuilderOverride + themeOverrides (no sessions / tickets). */
const ss9065ShapeSettings = {
	version: "1.0" as const,
	appBuilderOverride: {
		version: "1.0",
		containers: [
			{
				name: "left",
				tabs: [],
				stickyTabs: true,
				widgets: [
					{
						type: "stackUi",
						props: {
							name: "stackUi",
							widgets: [
								{
									type: "stackUi",
									props: {
										name: "stackUi",
										widgets: [
											{
												type: "controls",
												props: {
													controls: [
														{
															type: "parameter",
															props: {
																name: "Cubes",
															},
														},
														{
															type: "action",
															props: {
																definition: {
																	type: "addToCart",
																	props: {
																		description:
																			"Line item description",
																		tooltip:
																			"Add item to cart",
																	},
																},
															},
														},
													],
												},
											},
											{
												type: "actions",
												props: {
													actions: [
														{
															type: "addToCart",
															props: {
																description:
																	"Line item description",
																tooltip:
																	"Add item to cart",
															},
														},
														{
															type: "closeConfigurator",
															props: {},
														},
														{
															type: "setParameterValues",
															props: {
																message:
																	"Test message",
																parameterValues:
																	[
																		{
																			parameter:
																				{
																					name: "Cubes",
																				},
																			value: "12",
																		},
																	],
															},
														},
													],
												},
											},
										],
									},
								},
								{
									type: "controls",
									props: {
										controls: [
											{
												type: "parameter",
												props: {
													name: "Cubes",
												},
											},
											{
												type: "action",
												props: {
													definition: {
														type: "addToCart",
														props: {
															description:
																"Line item description",
															tooltip:
																"Add item to cart",
														},
													},
												},
											},
										],
									},
								},
								{
									type: "actions",
									props: {
										actions: [
											{
												type: "addToCart",
												props: {
													description:
														"Line item description",
													tooltip: "Add item to cart",
												},
											},
											{
												type: "closeConfigurator",
												props: {},
											},
											{
												type: "setParameterValues",
												props: {
													message: "Test message",
													parameterValues: [
														{
															parameter: {
																name: "Cubes",
															},
															value: "12",
														},
													],
												},
											},
										],
									},
								},
							],
						},
					},
					{
						type: "accordionUi",
						props: {
							items: [
								{
									name: "accordionUi",
									widgets: [
										{
											type: "controls",
											props: {
												controls: [
													{
														type: "parameter",
														props: {
															name: "Cubes",
														},
													},
													{
														type: "action",
														props: {
															definition: {
																type: "addToCart",
																props: {
																	description:
																		"Line item description",
																	tooltip:
																		"Add item to cart",
																},
															},
														},
													},
												],
											},
										},
										{
											type: "actions",
											props: {
												actions: [
													{
														type: "addToCart",
														props: {
															description:
																"Line item description",
															tooltip:
																"Add item to cart",
														},
													},
													{
														type: "closeConfigurator",
														props: {},
													},
													{
														type: "setParameterValues",
														props: {
															message:
																"Test message",
															parameterValues: [
																{
																	parameter: {
																		name: "Cubes",
																	},
																	value: "12",
																},
															],
														},
													},
												],
											},
										},
									],
								},
							],
						},
					},
				],
			},
		],
	},
	themeOverrides: {
		other: {
			forceColorScheme: "dark",
		},
	},
};

describe("validateAppBuilderSettingsJson appBuilderOverride", () => {
	it("validates appBuilderOverride fixture (SS-9065 shape, inline)", () => {
		const result = validateAppBuilderSettingsJson(ss9065ShapeSettings);
		expect(result.success).toBe(true);
	});

	it("accepts stackUi inside container tabs", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			appBuilderOverride: {
				version: "1.0",
				containers: [
					{
						name: "right",
						tabs: [
							{
								name: "Tab 01",
								widgets: [
									{
										type: "stackUi",
										props: {
											name: "Settings",
											widgets: [
												{
													type: "text",
													props: {text: "Inside stack"},
												},
											],
										},
									},
								],
							},
						],
					},
				],
			},
		});
		expect(result.success).toBe(true);
	});
});

describe("validateAppBuilderSettingsJson themeOverrides.other", () => {
	it("accepts v8ThemeSupport boolean", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {other: {v8ThemeSupport: true}},
		});
		expect(result.success).toBe(true);
	});

	it("accepts stateProtection boolean", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {other: {stateProtection: true}},
		});
		expect(result.success).toBe(true);
	});

	it("rejects unknown keys under themeOverrides.other", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {other: {v8ThemeSupport: true, notARealKey: true}},
		});
		expect(result.success).toBe(false);
	});
});

function settingsWithControlOverrides(overrides?: Record<string, unknown>) {
	return {
		version: "1.0" as const,
		appBuilderOverride: {
			version: "1.0",
			containers: [
				{
					name: "left",
					widgets: [
						{
							type: "controls",
							props: {
								controls: [
									{
										type: "parameter",
										props: {
											name: "File Input",
											...(overrides === undefined
												? {}
												: {overrides}),
										},
									},
								],
							},
						},
					],
				},
			],
		},
	};
}

describe("validateAppBuilderSettingsJson resettable overrides", () => {
	it("rejects overrides.resettable (must be settings.resettable)", () => {
		const result = validateAppBuilderSettingsJson(
			settingsWithControlOverrides({resettable: true}),
		);
		expect(result.success).toBe(false);
	});

	it("accepts omitted resettable", () => {
		const result = validateAppBuilderSettingsJson(
			settingsWithControlOverrides(),
		);
		expect(result.success).toBe(true);
	});

	it("accepts overrides.settings.resettable true", () => {
		const result = validateAppBuilderSettingsJson(
			settingsWithControlOverrides({settings: {resettable: true}}),
		);
		expect(result.success).toBe(true);
	});

	it("accepts overrides.settings.resettable false", () => {
		const result = validateAppBuilderSettingsJson(
			settingsWithControlOverrides({settings: {resettable: false}}),
		);
		expect(result.success).toBe(true);
	});
});

const baseLayoutParameter = {
	id: "p1",
	defval: "",
	name: "File Input",
	type: "File",
	hidden: false,
};

function layoutWithParameter(parameter: Record<string, unknown>) {
	return {
		version: "1.0" as const,
		containers: [],
		parameters: [parameter],
	};
}

describe("validateAppBuilder resettable on parameters[]", () => {
	it("rejects top-level resettable (must be settings.resettable)", () => {
		const result = validateAppBuilder(
			layoutWithParameter({...baseLayoutParameter, resettable: true}),
		);
		expect(result.success).toBe(false);
	});

	it("accepts omitted resettable", () => {
		const result = validateAppBuilder(
			layoutWithParameter({...baseLayoutParameter}),
		);
		expect(result.success).toBe(true);
	});

	it("accepts settings.resettable true", () => {
		const result = validateAppBuilder(
			layoutWithParameter({
				...baseLayoutParameter,
				settings: {resettable: true},
			}),
		);
		expect(result.success).toBe(true);
	});

	it("accepts settings.resettable false", () => {
		const result = validateAppBuilder(
			layoutWithParameter({
				...baseLayoutParameter,
				settings: {resettable: false},
			}),
		);
		expect(result.success).toBe(true);
	});
});
