import {
	AppBuilderContainerNameType,
	IAppBuilderStandardContainer,
	IAppBuilderTab,
	IAppBuilderWidget,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	defaultsWithoutHiddenOriginals,
	planMobileFallbacks,
} from "../applyMobileFallbacks";

const widget = (id: string): IAppBuilderWidget =>
	({
		type: "text",
		props: {text: id},
	}) as IAppBuilderWidget;

const tab = (name: string, id: string): IAppBuilderTab => ({
	name,
	widgets: [widget(id)],
});

const container = (
	name: IAppBuilderStandardContainer["name"],
	overrides: Partial<IAppBuilderStandardContainer> = {},
): IAppBuilderStandardContainer => ({
	name,
	...overrides,
});

const emptyMap = () => ({
	left: undefined,
	right: undefined,
	top: undefined,
	bottom: undefined,
});

describe("planMobileFallbacks", () => {
	it("moves original content one hop using theme defaults", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
				}),
				bottom: container(AppBuilderContainerNameType.Bottom, {
					widgets: [widget("bottom")],
				}),
			},
			{
				right: {container: "bottom", position: "after"},
			},
		);

		expect(plan.hideOriginal).toEqual(["right"]);
		expect(plan.injections).toEqual([
			{
				from: "right",
				to: "bottom",
				position: "after",
				order: 0,
			},
		]);
	});

	it("keeps the theme when JSON mobileFallback is an empty object", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
					props: {mobileFallback: {}},
				}),
			},
			{
				right: {container: "bottom", position: "after"},
			},
		);

		expect(plan.injections).toEqual([
			{
				from: "right",
				to: "bottom",
				position: "after",
				order: 0,
			},
		]);
	});

	it("lets JSON overlay disabled onto a theme move without injecting", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
					props: {mobileFallback: {disabled: true}},
				}),
			},
			{
				right: {container: "bottom"},
			},
		);

		expect(plan.hideOriginal).toEqual(["right"]);
		expect(plan.injections).toEqual([]);
	});

	it("lets JSON overlay container onto the theme", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
					props: {mobileFallback: {container: "left"}},
				}),
			},
			{
				right: {container: "bottom", position: "after"},
			},
		);

		expect(plan.injections).toEqual([
			{
				from: "right",
				to: "left",
				position: "after",
				order: 0,
			},
		]);
	});

	it("does not skip the target fallback; only original content moves one hop", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				left: container(AppBuilderContainerNameType.Left, {
					widgets: [widget("left")],
					props: {
						mobileFallback: {
							container: "right",
							position: "before",
						},
					},
				}),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
					props: {mobileFallback: {container: "bottom"}},
				}),
				bottom: container(AppBuilderContainerNameType.Bottom, {
					widgets: [widget("bottom")],
				}),
			},
			undefined,
		);

		expect(plan.hideOriginal).toEqual(["left", "right"]);
		expect(plan.injections).toEqual([
			{
				from: "left",
				to: "right",
				position: "before",
				order: 0,
			},
			{
				from: "right",
				to: "bottom",
				position: "after",
				order: 0,
			},
		]);
	});

	it("injects into a disabled target without moving the target’s original along", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
					props: {mobileFallback: {container: "bottom"}},
				}),
				bottom: container(AppBuilderContainerNameType.Bottom, {
					widgets: [widget("bottom")],
					props: {mobileFallback: {disabled: true}},
				}),
			},
			undefined,
		);

		expect(plan.hideOriginal).toEqual(["right", "bottom"]);
		expect(plan.injections).toEqual([
			{
				from: "right",
				to: "bottom",
				position: "after",
				order: 0,
			},
		]);
	});

	it("orders multiple sources falling into the same target", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				left: container(AppBuilderContainerNameType.Left, {
					widgets: [widget("left")],
				}),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
				}),
			},
			{
				left: {container: "bottom", position: "after", order: 1},
				right: {container: "bottom", position: "after", order: 0},
			},
		);

		expect(plan.injections.map((injection) => injection.from)).toEqual([
			"right",
			"left",
		]);
	});

	it("leaves a self-target in place", () => {
		const warnings: string[] = [];
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
					props: {mobileFallback: {container: "right"}},
				}),
			},
			undefined,
			{onWarn: (message) => warnings.push(message)},
		);

		expect(plan.hideOriginal).toEqual([]);
		expect(plan.injections).toEqual([]);
		expect(warnings.length).toBeGreaterThan(0);
	});

	it("keeps previous behavior when JSON and theme omit a fallback", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
				}),
			},
			undefined,
		);

		expect(plan.hideOriginal).toEqual([]);
		expect(plan.injections).toEqual([]);
	});

	it("still injects when the destination container is empty", () => {
		const plan = planMobileFallbacks(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					tabs: [tab("Details", "right")],
					stickyTabs: false,
				}),
			},
			{
				right: {container: "bottom"},
			},
		);

		expect(plan.injections).toEqual([
			{
				from: "right",
				to: "bottom",
				position: "after",
				order: 0,
			},
		]);
	});
});

describe("defaultsWithoutHiddenOriginals", () => {
	it("omits original JSON for hidden sources", () => {
		const result = defaultsWithoutHiddenOriginals(
			{
				...emptyMap(),
				right: container(AppBuilderContainerNameType.Right, {
					widgets: [widget("right")],
				}),
				bottom: container(AppBuilderContainerNameType.Bottom, {
					widgets: [widget("bottom")],
				}),
			},
			["right"],
		);

		expect(result.right).toBeUndefined();
		expect(result.bottom?.widgets).toEqual([widget("bottom")]);
	});
});
