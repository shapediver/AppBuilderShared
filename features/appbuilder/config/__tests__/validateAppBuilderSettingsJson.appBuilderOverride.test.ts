import {validateAppBuilderSettingsJson} from "../appbuildertypecheck";

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
});

describe("validateAppBuilderSettingsJson themeOverrides.other", () => {
	it("accepts v8ThemeSupport boolean", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {other: {v8ThemeSupport: true}},
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
