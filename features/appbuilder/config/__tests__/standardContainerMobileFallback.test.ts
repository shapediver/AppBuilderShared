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
}));

jest.mock("@shapediver/viewer.shared.types", () => ({
	...jest.requireActual("@shapediver/viewer.shared.types"),
	ATTRIBUTE_VISUALIZATION: {
		LINEAR: "linear",
	},
	CAMERA_TYPE: {
		PERSPECTIVE: "perspective",
		ORTHOGRAPHIC: "orthographic",
	},
}));

import * as fs from "node:fs";
import * as path from "node:path";
import {
	formatAppBuilderZodError,
	validateAppBuilder,
	validateAppBuilderSettingsJson,
} from "../appbuildertypecheck";

describe("standard container mobileFallback schema", () => {
	it("still accepts a standard container without props", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [{name: "right", widgets: []}],
		});
		expect(result.success).toBe(true);
	});

	it("accepts props.mobileFallback on a standard container", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "right",
					props: {
						mobileFallback: {
							container: "bottom",
							position: "after",
							order: 1,
						},
					},
					widgets: [{type: "text", props: {text: "hello"}}],
				},
			],
		});
		expect(result.success).toBe(true);
	});

	it("accepts disabled-only mobileFallback", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "left",
					props: {mobileFallback: {disabled: true}},
				},
			],
		});
		expect(result.success).toBe(true);
	});

	it("rejects unknown mobileFallback keys", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "right",
					props: {mobileFallback: {previewIcon: "tabler:x"}},
				},
			],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a non-standard fallback container", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "right",
					props: {mobileFallback: {container: "toolbar"}},
				},
			],
		});
		expect(result.success).toBe(false);
	});

	it("accepts an empty mobileFallback object", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "right",
					props: {mobileFallback: {}},
				},
			],
		});
		expect(result.success).toBe(true);
	});
});

describe("viewport anchor mobileFallback schema", () => {
	it("accepts position and order on a 2d anchor", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "anchor2d",
					props: {
						id: "a",
						mobileFallback: {
							container: "bottom",
							position: "before",
							order: 1,
						},
					},
				},
			],
		});
		expect(result.success).toBe(true);
	});

	it("rejects a non-standard fallback container on a 3d anchor", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "anchor3d",
					props: {
						id: "b",
						location: [0, 0, 0],
						mobileFallback: {container: "toolbar"},
					},
				},
			],
		});
		expect(result.success).toBe(false);
	});
});

describe("theme mobileFallbacks home", () => {
	it("accepts mobileFallbacks on AppBuilderTemplateSelector", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {
				components: {
					AppBuilderTemplateSelector: {
						defaultProps: {
							mobileBreakpoint: "md",
							mobileFallbacks: {
								right: {container: "bottom", position: "after"},
							},
						},
					},
				},
			},
		});
		expect(result.success).toBe(true);
	});

	it("rejects mobileFallbacks on AppBuilderAppShellTemplatePage", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			themeOverrides: {
				components: {
					AppBuilderAppShellTemplatePage: {
						defaultProps: {
							mobileFallbacks: {
								right: {container: "bottom"},
							},
						},
					},
				},
			},
		});
		expect(result.success).toBe(false);
	});
});

describe("example-mobileFallback settings files", () => {
	function loadExample(fileName: string) {
		return JSON.parse(
			fs.readFileSync(path.resolve("public", fileName), "utf8"),
		);
	}

	function expectValidSettings(json: unknown) {
		const result = validateAppBuilderSettingsJson(json);
		if (!result.success) {
			throw new Error(formatAppBuilderZodError(result.error));
		}
		expect(result.success).toBe(true);
	}

	it("validates public/example-mobileFallback.json", () => {
		const json = loadExample("example-mobileFallback.json");
		expectValidSettings(json);

		const components = json.themeOverrides.components;
		expect(
			components.AppBuilderTemplateSelector.defaultProps.mobileBreakpoint,
		).toBe("md");
		expect(
			components.AppBuilderTemplateSelector.defaultProps.mobileFallbacks,
		).toBeDefined();
		expect(
			components.AppBuilderTemplateSelector.defaultProps.template,
		).toBeUndefined();
		expect(components.AppBuilderAppShellTemplatePage).toBeUndefined();
		expect(components.ViewportAnchor2d.defaultProps.mobileBreakpoint).toBe(
			"md",
		);
	});

	it("validates public/example-mobileFallback-grid.json as grid", () => {
		const appshell = loadExample("example-mobileFallback.json");
		const grid = loadExample("example-mobileFallback-grid.json");
		expectValidSettings(grid);

		const appshellTheme =
			appshell.themeOverrides.components.AppBuilderTemplateSelector
				.defaultProps;
		const gridTheme =
			grid.themeOverrides.components.AppBuilderTemplateSelector
				.defaultProps;
		const {template, ...gridThemeRest} = gridTheme;
		expect(template).toBe("grid");
		expect(gridThemeRest).toEqual(appshellTheme);
		expect(grid.appBuilderOverride).toEqual(appshell.appBuilderOverride);
		expect(grid.themeOverrides.components.ViewportAnchor2d).toEqual(
			appshell.themeOverrides.components.ViewportAnchor2d,
		);
		expect(
			grid.themeOverrides.components.AppBuilderGridTemplatePage
				.defaultProps.bottomFullWidth,
		).toBe(true);
	});

	it("validates public/example-mobileFallback-tabs.json", () => {
		const json = loadExample("example-mobileFallback-tabs.json");
		expectValidSettings(json);
		const containers = json.appBuilderOverride.containers;
		expect(containers[0].name).toBe("left");
		expect(containers[0].tabs).toHaveLength(2);
		expect(containers[1].name).toBe("right");
		expect(containers[2].name).toBe("bottom");
		expect(containers[2].tabs).toHaveLength(2);
	});

	it("validates public/example-mobileFallback-anchors.json", () => {
		const json = loadExample("example-mobileFallback-anchors.json");
		expectValidSettings(json);
		const components = json.themeOverrides.components;
		expect(
			components.ViewportAnchor2d.defaultProps.mobileFallback.container,
		).toBe("bottom");
		expect(
			components.ViewportAnchor3d.defaultProps.mobileFallback,
		).toBeUndefined();
		const containers = json.appBuilderOverride.containers;
		expect(
			containers.map((container: {name: string}) => container.name),
		).toEqual(["anchor3d", "anchor3d", "anchor2d", "anchor2d"]);
	});

	it("validates public/example-mobileFallback-keepBottom.json", () => {
		const json = loadExample("example-mobileFallback-keepBottom.json");
		expectValidSettings(json);
		expect(
			json.themeOverrides.components.AppBuilderAppShellTemplatePage
				.defaultProps.keepBottomInGrid,
		).toBe(true);
		expect(
			json.themeOverrides.components.AppBuilderAppShellTemplatePage
				.defaultProps.bottomFullWidth,
		).toBe(true);
	});
});
