import type {IShapeDiverParameterDefinition} from "@AppBuilderLib/entities/parameter/config/parameter";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import type {IAppBuilderWidget} from "../../config/appbuilder";
import {
	isContainerEmpty,
	isParameterControlEmpty,
	isWidgetEmpty,
	type ParameterDefinitionLookup,
} from "../isContainerEmpty";

const definition = (
	partial: Partial<IShapeDiverParameterDefinition> & {settings?: unknown},
): IShapeDiverParameterDefinition =>
	({
		id: "p",
		name: "p",
		type: PARAMETER_TYPE.FLOAT,
		...partial,
	}) as unknown as IShapeDiverParameterDefinition;

const interaction = (
	type: string,
	props: Record<string, unknown>,
	hidden = false,
) =>
	definition({
		type: PARAMETER_TYPE.INTERACTION,
		hidden,
		settings: {type, props},
	});

const slider = definition({type: PARAMETER_TYPE.FLOAT});

const control = (name: string, sessionId?: string, overrides?: object) =>
	({
		type: "parameter",
		props: {name, sessionId, overrides},
	}) as unknown as NonNullable<
		Extract<IAppBuilderWidget, {type: "controls"}>["props"]["controls"]
	>[number];

const controls = (...items: ReturnType<typeof control>[]) =>
	({type: "controls", props: {controls: items}}) as IAppBuilderWidget;
const text = (props: object) => ({type: "text", props}) as IAppBuilderWidget;

const lookup =
	(
		definitions: Record<string, IShapeDiverParameterDefinition>,
	): ParameterDefinitionLookup =>
	(namespace, id) =>
		definitions[`${namespace}/${id}`];

describe("isParameterControlEmpty", () => {
	const ref = control("p").props;

	it("is empty for an unknown or hidden parameter", () => {
		expect(isParameterControlEmpty(undefined, ref)).toBe(true);
		expect(
			isParameterControlEmpty(
				definition({type: PARAMETER_TYPE.FLOAT, hidden: true}),
				ref,
			),
		).toBe(true);
		expect(
			isParameterControlEmpty(slider, {
				...ref,
				overrides: {hidden: true},
			}),
		).toBe(true);
	});

	it("has content for a plain parameter", () => {
		expect(isParameterControlEmpty(slider, ref)).toBe(false);
	});

	it("is empty for always active interaction parameters in the toolbar", () => {
		for (const type of ["selection", "gumball", "rectangleTransform"]) {
			expect(
				isParameterControlEmpty(
					interaction(type, {activeMode: "alwaysActive"}),
					ref,
				),
			).toBe(true);
			expect(isParameterControlEmpty(interaction(type, {}), ref)).toBe(
				false,
			);
			expect(
				isParameterControlEmpty(
					interaction(type, {
						activeMode: "alwaysActive",
						presentation: "widget",
					}),
					ref,
				),
			).toBe(false);
			expect(
				isParameterControlEmpty(
					interaction(type, {presentation: "toolbar"}),
					ref,
				),
			).toBe(true);
		}
	});

	it("reads the drawing settings from general", () => {
		expect(
			isParameterControlEmpty(
				interaction("drawing", {
					general: {activeMode: "alwaysActive"},
				}),
				ref,
			),
		).toBe(true);
		expect(
			isParameterControlEmpty(
				interaction("drawing", {
					general: {
						activeMode: "alwaysActive",
						presentation: "widget",
					},
				}),
				ref,
			),
		).toBe(false);
		expect(isParameterControlEmpty(interaction("drawing", {}), ref)).toBe(
			false,
		);
	});

	it("applies the settings overrides of the control", () => {
		expect(
			isParameterControlEmpty(
				interaction("gumball", {activeMode: "alwaysActive"}),
				{
					...ref,
					overrides: {settings: {props: {presentation: "widget"}}},
				},
			),
		).toBe(false);
	});

	it("has content for other interaction parameters", () => {
		expect(
			isParameterControlEmpty(
				interaction("dragging", {activeMode: "alwaysActive"}),
				ref,
			),
		).toBe(false);
	});
});

describe("isWidgetEmpty / isContainerEmpty", () => {
	const definitions = lookup({
		"s/toolbar": interaction("gumball", {activeMode: "alwaysActive"}),
		"s_appbuilder/toolbar": interaction("rectangleTransform", {
			activeMode: "alwaysActive",
		}),
		"s/slider": slider,
	});

	it("treats text widgets by their text", () => {
		expect(isWidgetEmpty(text({}), "s", definitions)).toBe(true);
		expect(isWidgetEmpty(text({text: "Hi"}), "s", definitions)).toBe(false);
		expect(isWidgetEmpty(text({markdown: "# Hi"}), "s", definitions)).toBe(
			false,
		);
	});

	it("treats controls widgets by their parameters", () => {
		expect(
			isWidgetEmpty(controls(control("toolbar")), "s", definitions),
		).toBe(true);
		expect(
			isWidgetEmpty(
				controls(control("toolbar", "s_appbuilder")),
				"s",
				definitions,
			),
		).toBe(true);
		expect(
			isWidgetEmpty(
				controls(control("toolbar"), control("slider")),
				"s",
				definitions,
			),
		).toBe(false);
		expect(isWidgetEmpty(controls(), "s", definitions)).toBe(true);
		// an export control always renders
		expect(
			isWidgetEmpty(
				{
					type: "controls",
					props: {controls: [{type: "export", props: {name: "e"}}]},
				} as IAppBuilderWidget,
				"s",
				definitions,
			),
		).toBe(false);
	});

	it("counts any other widget as content", () => {
		expect(
			isWidgetEmpty(
				{type: "image", props: {href: "x"}} as IAppBuilderWidget,
				"s",
				definitions,
			),
		).toBe(false);
	});

	it("is empty without tabs when every widget is empty", () => {
		expect(isContainerEmpty({}, "s", definitions)).toBe(true);
		expect(
			isContainerEmpty(
				{widgets: [text({}), controls(control("toolbar"))]},
				"s",
				definitions,
			),
		).toBe(true);
		expect(
			isContainerEmpty(
				{widgets: [text({}), controls(control("slider"))]},
				"s",
				definitions,
			),
		).toBe(false);
		expect(
			isContainerEmpty(
				{tabs: [{name: "t"}], widgets: []},
				"s",
				definitions,
			),
		).toBe(false);
	});
});
