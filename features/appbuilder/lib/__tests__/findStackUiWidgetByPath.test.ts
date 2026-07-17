import {IAppBuilderWidget} from "../../config/appbuilder";
import {findStackUiWidgetByPath} from "../findStackUiWidgetByPath";

const textWidget = (text: string): IAppBuilderWidget => ({
	type: "text",
	props: {text},
});

const stackWidget = (
	name: string,
	widgets: IAppBuilderWidget[],
): IAppBuilderWidget => ({
	type: "stackUi",
	props: {name, widgets},
});

describe("findStackUiWidgetByPath", () => {
	const rootWidgets: IAppBuilderWidget[] = [
		textWidget("intro"),
		stackWidget("outer", [
			textWidget("outer-content"),
			stackWidget("inner", [textWidget("inner-content")]),
		]),
	];

	it("returns undefined for empty path", () => {
		expect(findStackUiWidgetByPath(rootWidgets, [])).toBeUndefined();
	});

	it("returns undefined for missing widgets", () => {
		expect(findStackUiWidgetByPath(undefined, ["outer"])).toBeUndefined();
	});

	it("resolves a top-level stack", () => {
		const result = findStackUiWidgetByPath(rootWidgets, ["outer"]);

		expect(result?.name).toBe("outer");
		expect(result?.widgets).toHaveLength(2);
	});

	it("resolves a nested stack path", () => {
		const result = findStackUiWidgetByPath(rootWidgets, ["outer", "inner"]);

		expect(result?.name).toBe("inner");
		expect(result?.widgets).toHaveLength(1);
		expect(result?.widgets[0]).toEqual(textWidget("inner-content"));
	});

	it("returns undefined when a segment is missing", () => {
		expect(
			findStackUiWidgetByPath(rootWidgets, ["outer", "missing"]),
		).toBeUndefined();
	});

	it("returns the first stack when multiple siblings share the same name", () => {
		const widgets: IAppBuilderWidget[] = [
			stackWidget("dup", [textWidget("first")]),
			stackWidget("dup", [textWidget("second")]),
		];

		const result = findStackUiWidgetByPath(widgets, ["dup"]);

		expect(result?.widgets[0]).toEqual(textWidget("first"));
	});

	// SS-9879: stack buttons live in tab.widgets; shell must resolve that list, not [].
	it("resolves stackUi from tab widget list (liveWidgets for a tab panel)", () => {
		const tabWidgets: IAppBuilderWidget[] = [
			textWidget("tab intro"),
			stackWidget("Settings", [
				textWidget("inside"),
				stackWidget("Nested", [textWidget("nested")]),
			]),
		];

		expect(findStackUiWidgetByPath(tabWidgets, ["Settings"])?.name).toBe(
			"Settings",
		);
		expect(
			findStackUiWidgetByPath(tabWidgets, ["Settings", "Nested"])?.name,
		).toBe("Nested");
	});

	it("fails to resolve when liveWidgets is empty container.widgets (pre-fix bug)", () => {
		expect(findStackUiWidgetByPath([], ["Settings"])).toBeUndefined();
		expect(
			findStackUiWidgetByPath(undefined, ["Settings"]),
		).toBeUndefined();
	});
});
