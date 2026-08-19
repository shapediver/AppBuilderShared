import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {
	AppBuilderContainerNameType,
	type IAppBuilder,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {ListParameterDefinitionsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import {ResParameterType} from "@shapediver/sdk.geometry-api-sdk-v2";
import {collectUiParameterRefs} from "../lib/collectUiParameterRefs";
import {
	filterParametersForAgent,
	type NamespacedParameter,
} from "../lib/filterParametersForAgent";

function param(
	id: string,
	opts: {hidden?: boolean; name?: string; displayname?: string} = {},
): IShapeDiverParameter<unknown> {
	return {
		definition: {
			id,
			name: opts.name ?? id,
			displayname: opts.displayname,
			type: ResParameterType.FLOAT,
			hidden: opts.hidden ?? false,
		},
		state: {uiValue: 1},
		actions: {},
		acceptRejectMode: false,
	} as unknown as IShapeDiverParameter<unknown>;
}

function ns(
	parameter: IShapeDiverParameter<unknown>,
	namespace = "c",
): NamespacedParameter {
	return {namespace, parameter};
}

function ids(result: NamespacedParameter[]): string[] {
	return result.map((p) => p.parameter.definition.id);
}

const settings: ListParameterDefinitionsToolSettings = {
	name: "list_parameter_definitions",
};

describe("filterParametersForAgent", () => {
	it("excludes hidden by default", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a")), ns(param("b", {hidden: true}))],
			controllerNamespace: "c",
			settings,
			uiRefs: [{name: "a"}, {name: "b"}],
		});
		expect(ids(result)).toEqual(["a"]);
	});

	it("includes hidden when filter.hidden is include", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a")), ns(param("b", {hidden: true}))],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				filter: {hidden: "include"},
			},
			uiRefs: [{name: "a"}, {name: "b"}],
		});
		expect(ids(result)).toEqual(["a", "b"]);
	});

	it("excludes invisible when filter.invisible is exclude", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a")), ns(param("b"))],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				filter: {invisible: "exclude"},
			},
			uiRefs: [{name: "a"}],
		});
		expect(ids(result)).toEqual(["a"]);
	});

	it("includes invisible by default", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a")), ns(param("b"))],
			controllerNamespace: "c",
			settings,
			uiRefs: [{name: "a"}],
		});
		expect(ids(result)).toEqual(["a", "b"]);
	});

	it("explicit parameters list wins over filter", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a")), ns(param("b", {hidden: true}))],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				parameters: [{name: "b"}],
				filter: {hidden: "exclude"},
			},
			uiRefs: [],
		});
		expect(ids(result)).toEqual(["b"]);
	});

	it("returns empty array without error when nothing matches", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a"))],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				parameters: [{name: "missing"}],
			},
			uiRefs: [],
		});
		expect(result).toEqual([]);
	});

	it("keeps only controllerNamespace when sessionIds omitted", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a"), "c"), ns(param("b"), "other")],
			controllerNamespace: "c",
			settings,
			uiRefs: [{name: "a"}, {name: "b"}],
		});
		expect(ids(result)).toEqual(["a"]);
	});

	it("keeps listed sessionIds when provided", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a"), "c"), ns(param("b"), "other")],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				filter: {sessionIds: ["c", "other"]},
			},
			uiRefs: [{name: "a"}, {name: "b"}],
		});
		expect(ids(result)).toEqual(["a", "b"]);
	});

	it("matches explicit ref sessionId to parameter namespace", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("width"), "c"), ns(param("width"), "other")],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				parameters: [{name: "width", sessionId: "other"}],
			},
			uiRefs: [],
		});
		expect(result).toEqual([ns(param("width"), "other")]);
		expect(result[0]?.namespace).toBe("other");
	});

	it("treats missing sessionId on ref as controller namespace", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("width"), "c"), ns(param("width"), "other")],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				parameters: [{name: "width"}],
			},
			uiRefs: [],
		});
		expect(result[0]?.namespace).toBe("c");
		expect(ids(result)).toEqual(["width"]);
	});

	it("matches uiRefs by displayname and sessionId", () => {
		const hiddenName = param("id-1", {name: "internal", displayname: "Width"});
		const result = filterParametersForAgent({
			parameters: [ns(hiddenName), ns(param("id-2"))],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				filter: {invisible: "exclude"},
			},
			uiRefs: [{name: "Width"}],
		});
		expect(ids(result)).toEqual(["id-1"]);
	});

	it("does not treat uiRef without sessionId as other-session match", () => {
		const result = filterParametersForAgent({
			parameters: [ns(param("a"), "c"), ns(param("b"), "other")],
			controllerNamespace: "c",
			settings: {
				name: "list_parameter_definitions",
				filter: {invisible: "exclude", sessionIds: ["c", "other"]},
			},
			uiRefs: [{name: "b"}],
		});
		expect(ids(result)).toEqual([]);
	});
});

describe("collectUiParameterRefs", () => {
	it("collects accordion, controls, form, nested, and toolbar refs", () => {
		const appBuilder: IAppBuilder = {
			version: "1.0",
			containers: [
				{
					name: AppBuilderContainerNameType.Left,
					widgets: [
						{
							type: "accordion",
							props: {
								parameters: [
									{name: "a"},
									{name: "b", sessionId: "s2"},
								],
							},
						},
						{
							type: "controls",
							props: {
								controls: [
									{type: "parameter", props: {name: "c"}},
									{type: "export", props: {name: "stl"}},
								],
							},
						},
						{
							type: "form",
							props: {
								parameters: [{name: "d"}],
								controls: [
									{
										type: "parameter",
										props: {name: "e", sessionId: "s3"},
									},
								],
							},
						},
						{
							type: "stackUi",
							props: {
								name: "stack",
								widgets: [
									{
										type: "accordion",
										props: {parameters: [{name: "nested"}]},
									},
								],
							},
						},
					],
					tabs: [
						{
							name: "tab",
							widgets: [
								{
									type: "accordionUi",
									props: {
										items: [
											{
												name: "item",
												widgets: [
													{
														type: "accordion",
														props: {
															parameters: [
																{name: "tabbed"},
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
				{
					name: AppBuilderContainerNameType.Toolbar,
					props: {id: "tb"},
					groups: [
						[
							{
								type: "parameter",
								props: {name: "toolbarParam"},
							},
							{
								type: "export",
								props: {name: "ignored"},
							},
							{
								type: "widgets",
								props: {
									widgets: [
										{
											type: "accordion",
											props: {
												parameters: [{name: "inPanel"}],
											},
										},
									],
								},
							},
							{
								type: "tabs",
								props: {
									tabs: [
										{
											name: "t",
											widgets: [
												{
													type: "controls",
													props: {
														controls: [
															{
																type: "parameter",
																props: {
																	name: "inTab",
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
					],
				},
			],
		};

		expect(collectUiParameterRefs(appBuilder)).toEqual([
			{name: "tabbed"},
			{name: "a"},
			{name: "b", sessionId: "s2"},
			{name: "c"},
			{name: "d"},
			{name: "e", sessionId: "s3"},
			{name: "nested"},
			{name: "toolbarParam"},
			{name: "inPanel"},
			{name: "inTab"},
		]);
	});

	it("returns empty array when no parameter refs exist", () => {
		const appBuilder: IAppBuilder = {
			version: "1.0",
			containers: [
				{
					name: AppBuilderContainerNameType.Right,
					widgets: [{type: "text", props: {text: "hi"}}],
				},
			],
		};
		expect(collectUiParameterRefs(appBuilder)).toEqual([]);
	});
});
