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

describe("example-mobileFallback settings file", () => {
	it("validates public/example-mobileFallback.json", () => {
		const json = JSON.parse(
			fs.readFileSync(
				path.resolve("public/example-mobileFallback.json"),
				"utf8",
			),
		);
		const result = validateAppBuilderSettingsJson(json);
		if (!result.success) {
			throw new Error(formatAppBuilderZodError(result.error));
		}
		expect(result.success).toBe(true);
	});
});
