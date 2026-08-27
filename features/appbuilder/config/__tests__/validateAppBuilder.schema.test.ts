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
	validateNumberParameterSettings,
	validateSelectParameterSettings,
	validateStringParameterSettings,
} from "../appbuildertypecheck";

const database = {
	dataSource: {href: "/sample.csv"},
	itemDataDefinition: {value: 0},
	filters: [{column: 0}],
};

const itemData = {
	displayname: "A",
	tooltip: "tip",
	description: "desc",
	imageUrl: "https://example.com/a.png",
	color: "#f00",
	hidden: false,
	data: {k: 1},
};

const plotSettings = {
	xaxis: true,
	xlabel: "X",
	yaxis: true,
	ylabel: "Y",
	grid: "xy" as const,
	dots: true,
	legend: true,
};

const chartData = {
	keys: ["a"],
	series: [{name: "s", color: "#000", values: [1]}],
};

function skeleton(partial: {
	parameters?: unknown[];
	widgets?: unknown[];
	containers?: unknown[];
	instances?: unknown[];
}) {
	return {
		version: "1.0" as const,
		parameters: partial.parameters,
		instances: partial.instances,
		containers: partial.containers ?? [
			{name: "left", widgets: partial.widgets ?? []},
		],
	};
}

function expectAppBuilderMatch(input: unknown) {
	const result = validateAppBuilder(input);
	expect(result.success).toBe(true);
	if (!result.success) return;
	expect(result.data).toMatchObject(input as object);
}

describe("validateSelectParameterSettings / string / number", () => {
	it("keeps select itemData and settings fields", () => {
		const payload = {
			type: "dropdown" as const,
			itemData: {a: itemData},
			searchable: true,
			limit: 5,
			height: "200px",
		};
		const result = validateSelectParameterSettings(payload);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data).toMatchObject(payload);
	});

	it("accepts database with grid and fullwidthcards", () => {
		for (const type of ["grid", "fullwidthcards"] as const) {
			const payload = {type, database};
			const result = validateSelectParameterSettings(payload);
			expect(result.success).toBe(true);
			if (!result.success) return;
			expect(result.data).toMatchObject(payload);
		}
	});

	it("rejects database without grid/fullwidthcards", () => {
		const result = validateSelectParameterSettings({
			type: "dropdown",
			database,
		});
		expect(result.success).toBe(false);
	});

	it("keeps string selectSettings items and source", () => {
		const payload = {
			lines: 3,
			debounce: 100,
			mode: "debounce",
			selectSettings: {
				type: "dropdown" as const,
				items: ["a", "b"],
				source: "src",
			},
		};
		const result = validateStringParameterSettings(payload);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data).toMatchObject(payload);
	});

	it("keeps number marks and step", () => {
		const payload = {
			step: 0.5,
			marks: [{value: 1, label: "one"}],
			restrictToMarks: true,
			min: 0,
			max: 10,
		};
		const result = validateNumberParameterSettings(payload);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data).toMatchObject(payload);
	});

	it("rejects null and undefined number settings", () => {
		expect(validateNumberParameterSettings(undefined).success).toBe(false);
		expect(validateNumberParameterSettings(null).success).toBe(false);
	});
});

describe("validateAppBuilder parameters, widgets, containers, instances", () => {
	it("accepts parameter group and accordion overrides", () => {
		expectAppBuilderMatch(
			skeleton({
				parameters: [
					{
						id: "p1",
						defval: "1",
						name: "P",
						type: "Int",
						hidden: false,
						group: {id: "g1", name: "Group"},
					},
				],
				widgets: [
					{
						type: "accordion",
						props: {
							parameters: [
								{
									name: "P",
									overrides: {
										displayname: "Display",
										group: {id: "g1", name: "Group"},
										order: 2,
										tooltip: "tip",
										hidden: true,
										settings: {k: "v"},
										step: 0.5,
									},
								},
							],
							exports: [
								{
									name: "E",
									sessionId: "sid",
									overrides: {displayname: "Export"},
								},
							],
						},
					},
					{
						type: "image",
						props: {
							href: "https://example.com/x.png",
							export: {name: "exp", sessionId: "sid"},
						},
					},
				],
			}),
		);
	});

	it("defaults omitted control parameter delegates to []", () => {
		const result = validateAppBuilder(
			skeleton({
				widgets: [
					{
						type: "controls",
						props: {
							controls: [
								{
									type: "parameter",
									props: {
										name: "P",
										overrides: {
											displayname: "D",
											tooltip: "t",
											hidden: false,
											settings: {a: 1},
											step: 1,
										},
									},
								},
								{
									type: "output",
									props: {
										name: "out",
										overrides: {
											displayname: "O",
											tooltip: "ot",
											hidden: true,
										},
									},
								},
								{
									type: "parameter",
									props: {
										name: "Q",
										delegates: [
											{name: "d1", sessionId: "s"},
										],
									},
								},
							],
						},
					},
				],
			}),
		);
		expect(result.success).toBe(true);
		if (!result.success) return;
		const controls = (
			result.data.containers[0] as {
				widgets: Array<{
					props: {
						controls: Array<{
							props: {delegates?: unknown; overrides?: unknown};
						}>;
					};
				}>;
			}
		).widgets[0].props.controls;
		expect(controls[0].props.delegates).toEqual([]);
		expect(controls[0].props.overrides).toMatchObject({
			displayname: "D",
			settings: {a: 1},
			step: 1,
		});
		expect(controls[1].props.overrides).toMatchObject({
			displayname: "O",
			tooltip: "ot",
			hidden: true,
		});
		expect(controls[2].props.delegates).toEqual([
			{name: "d1", sessionId: "s"},
		]);
	});

	it.each([
		[
			"actions covering optional prop bags and unions",
			{
				type: "actions",
				props: {
					actions: [
						{type: "ar", props: {viewportId: "vp1"}},
						{
							type: "setBrowserLocation",
							props: {
								href: "https://example.com",
								pathname: "/x",
								search: "?q=1",
								hash: "#h",
								target: "_blank",
							},
						},
						{
							type: "messageToParent",
							props: {type: "evt", data: {a: 1}},
						},
						{
							type: "createModelState",
							props: {
								successMessage: "ok",
								errorMessage: "err",
								image: {href: "https://example.com/i.png"},
							},
						},
						{
							type: "camera",
							props: {
								type: "assign",
								props: {camera: {id: "c1", name: "cam"}},
							},
						},
						{
							type: "camera",
							props: {
								type: "assign",
								props: {camera: {type: "perspective"}},
							},
						},
						{
							type: "setContainerVisibility",
							props: {
								container: {name: "left"},
								mode: "toggle",
							},
						},
						{
							type: "setContainerVisibility",
							props: {
								container: {
									name: "anchor3d",
									props: {id: "a1"},
								},
								mode: "open",
							},
						},
					],
				},
			},
		],
		[
			"lineChart style + plotSettings",
			{
				type: "lineChart",
				props: {
					style: "linear",
					plotSettings,
					data: chartData,
				},
			},
		],
		[
			"areaChart style and type",
			{
				type: "areaChart",
				props: {
					style: "bump",
					type: "stacked",
					plotSettings,
					data: chartData,
				},
			},
		],
		[
			"barChart style",
			{
				type: "barChart",
				props: {
					style: "waterfall",
					plotSettings,
					data: chartData,
				},
			},
		],
		[
			"attributeVisualization number + string gradients",
			{
				type: "attributeVisualization",
				props: {
					title: "T",
					tooltip: "tip",
					attributes: [
						{
							attribute: "a1",
							gradient: {
								type: "number",
								min: 0,
								max: 1,
								steps: [
									{
										value: 0.5,
										colorBefore: "#000",
										colorAfter: "#fff",
									},
								],
							},
						},
					],
					defaultGradient: {
						type: "string",
						defaultColor: "#f00",
						labelColors: [{values: ["x"], color: "#0f0"}],
					},
					passiveMaterial: {color: "#ccc", opacity: 0.5},
				},
			},
		],
		[
			"attributeVisualization steps enum",
			{
				type: "attributeVisualization",
				props: {
					attributes: [
						{
							attribute: "a2",
							gradient: {
								type: "number",
								steps: "linear",
							},
						},
					],
				},
			},
		],
		[
			"agent / progress / desktopClient / savedStates",
			{
				type: "agent",
				props: {
					context: "ctx",
					parameterNames: ["p"],
					parameterNamesExclude: ["q"],
				},
			},
		],
	])("accepts %s", (_name, widget) => {
		expectAppBuilderMatch(skeleton({widgets: [widget]}));
	});

	it("accepts remaining optional-only widget bags", () => {
		expectAppBuilderMatch(
			skeleton({
				widgets: [
					{
						type: "progress",
						props: {
							showPercentage: true,
							showOnComplete: false,
							showMessages: true,
							delayRemoval: 250,
						},
					},
					{
						type: "desktopClientSelection",
						props: {
							clientsFilter: ["c1"],
							autoConnect: true,
						},
					},
					{
						type: "savedStates",
						props: {visualization: "grid"},
					},
				],
			}),
		);
	});

	it.each([
		["defaultValue string", {defaultValue: "one"}],
		["defaultValue array", {defaultValue: ["one"]}],
		["value string", {value: "one"}],
		["value array", {value: ["one"]}],
	])("accepts accordionUi %s", (_name, extra) => {
		expectAppBuilderMatch(
			skeleton({
				widgets: [
					{
						type: "accordionUi",
						props: {
							items: [
								{
									name: "one",
									widgets: [
										{type: "text", props: {text: "hi"}},
									],
								},
							],
							...extra,
						},
					},
				],
			}),
		);
	});

	it.each([
		["number", 120],
		["string", "20%"],
	])("accepts table column width as %s", (_name, width) => {
		expectAppBuilderMatch(
			skeleton({
				widgets: [
					{
						type: "table",
						props: {
							columns: [{accessor: "a", width}],
							records: [{a: 1}],
						},
					},
				],
			}),
		);
	});

	it("rejects camera id/name that are not strings", () => {
		const result = validateAppBuilder(
			skeleton({
				widgets: [
					{
						type: "actions",
						props: {
							actions: [
								{
									type: "camera",
									props: {
										type: "assign",
										props: {camera: {id: 1}},
									},
								},
							],
						},
					},
				],
			}),
		);
		expect(result.success).toBe(false);
	});

	it("rejects invalid setBrowserLocation target and setContainerVisibility", () => {
		expect(
			validateAppBuilder(
				skeleton({
					widgets: [
						{
							type: "actions",
							props: {
								actions: [
									{
										type: "setBrowserLocation",
										props: {target: "elsewhere"},
									},
								],
							},
						},
					],
				}),
			).success,
		).toBe(false);

		expect(
			validateAppBuilder(
				skeleton({
					widgets: [
						{
							type: "actions",
							props: {
								actions: [
									{
										type: "setContainerVisibility",
										props: {
											container: {name: "nope"},
											mode: "toggle",
										},
									},
								],
							},
						},
					],
				}),
			).success,
		).toBe(false);

		expect(
			validateAppBuilder(
				skeleton({
					widgets: [
						{
							type: "actions",
							props: {
								actions: [
									{
										type: "setContainerVisibility",
										props: {
											container: {name: "anchor3d"},
											mode: "open",
										},
									},
								],
							},
						},
					],
				}),
			).success,
		).toBe(false);

		expect(
			validateAppBuilder(
				skeleton({
					widgets: [
						{
							type: "actions",
							props: {
								actions: [
									{
										type: "setContainerVisibility",
										props: {
											container: {
												name: "anchor3d",
												props: {},
											},
											mode: "open",
										},
									},
								],
							},
						},
					],
				}),
			).success,
		).toBe(false);
	});

	it.each([["none"], ["x"], ["y"], ["xy"]])(
		"accepts chart plotSettings.grid %s",
		(grid) => {
			expectAppBuilderMatch(
				skeleton({
					widgets: [
						{
							type: "lineChart",
							props: {
								plotSettings: {...plotSettings, grid},
								data: chartData,
							},
						},
					],
				}),
			);
		},
	);

	it.each([
		"bump",
		"linear",
		"natural",
		"monotone",
		"step",
		"stepBefore",
		"stepAfter",
	])("accepts lineChart style %s", (style) => {
		expectAppBuilderMatch(
			skeleton({
				widgets: [
					{
						type: "lineChart",
						props: {style, plotSettings, data: chartData},
					},
				],
			}),
		);
	});

	it.each(["default", "stacked", "percent", "split"])(
		"accepts areaChart type %s",
		(type) => {
			expectAppBuilderMatch(
				skeleton({
					widgets: [
						{
							type: "areaChart",
							props: {type, plotSettings, data: chartData},
						},
					],
				}),
			);
		},
	);

	it.each(["default", "stacked", "percent", "waterfall"])(
		"accepts barChart style %s",
		(style) => {
			expectAppBuilderMatch(
				skeleton({
					widgets: [
						{
							type: "barChart",
							props: {style, plotSettings, data: chartData},
						},
					],
				}),
			);
		},
	);

	it("accepts anchor containers with union sizes, selectionColor, mobileFallback", () => {
		expectAppBuilderMatch(
			skeleton({
				containers: [
					{
						name: "anchor3d",
						props: {
							id: "a3",
							location: [0, 1, 2],
							width: 10,
							height: "10px",
							maxWidth: 300,
							maxHeight: "100px",
							selectionProperties: {
								selectionColor: "#f00",
								prompt: {
									inactiveTitle: "off",
									activeTitle: "on",
									activeText: "pick",
								},
								buttons: {clear: true},
							},
							mobileFallback: {
								disabled: false,
								previewIcon: "icon",
								container: "left",
							},
						},
						widgets: [],
					},
					{
						name: "anchor2d",
						props: {
							id: "a2",
							location: [0, 0],
							width: "20%",
							height: 50,
							maxWidth: 300,
							maxHeight: "80vh",
							selectionProperties: {
								selectionColor: {r: 1, g: 0, b: 0},
							},
							mobileFallback: {
								disabled: true,
								previewIcon: "p",
								container: "right",
							},
						},
						widgets: [],
					},
				],
			}),
		);
	});

	it.each(["left", "right", "top", "bottom"])(
		"accepts anchor3d mobileFallback.container %s",
		(container) => {
			expectAppBuilderMatch(
				skeleton({
					containers: [
						{
							name: "anchor3d",
							props: {
								id: "a3",
								location: [0, 0, 0],
								mobileFallback: {container},
							},
							widgets: [],
						},
					],
				}),
			);
		},
	);

	it("accepts instances with nested parameter sources and outputActions", () => {
		expectAppBuilderMatch(
			skeleton({
				instances: [
					{
						sessionId: "s1",
						slug: "my-slug",
						name: "inst",
						parameterValues: {
							dataOut: {
								type: "dataOutput",
								props: {name: "out", sessionId: "s"},
							},
							sdtf: {
								type: "sdtf",
								props: {
									name: "n",
									chunk: {id: "i", name: "c"},
								},
							},
							shot: {
								type: "screenshot",
								props: {contentType: "image/png"},
							},
							state: {
								type: "modelState",
								props: {
									updateUrl: true,
									successMessage: "ok",
									errorMessage: "err",
									image: {href: "https://example.com/i.png"},
								},
							},
							exp: {
								type: "export",
								props: {
									name: "e",
									parameterValues: {
										inner: {
											type: "dataOutput",
											props: {name: "nested"},
										},
									},
								},
							},
						},
						outputActions: [
							{
								type: "setParameterValue",
								props: {parameter: "p", output: "o"},
							},
						],
					},
				],
			}),
		);
	});
});
