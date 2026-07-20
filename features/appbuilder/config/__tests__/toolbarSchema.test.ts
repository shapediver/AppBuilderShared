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

import {readFileSync} from "fs";
import {
	validateAppBuilder,
	validateAppBuilderSettingsJson,
} from "../appbuildertypecheck";

const makeToolbarControl = (type: string, props: Record<string, unknown>) => ({
	type,
	props,
});

const makeSemanticAction = (definition: Record<string, unknown>) =>
	makeToolbarControl("action", {definition});

const makeLegacyViewportAction = (type: string) =>
	makeToolbarControl("action", {
		definition: {
			type: "viewport",
			props: {type},
		},
	});

describe("toolbar container schema", () => {
	it("accepts a valid toolbar container with mixed item types", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "mainToolbar",
						side: "top",
						align: "center",
						visibility: "always",
						groups: [
							[
								makeToolbarControl("parameter", {
									name: "Length",
								}),
								makeToolbarControl("export", {
									name: "Download",
								}),
								makeToolbarControl("action", {
									definition: {
										type: "closeConfigurator",
										props: {},
									},
								}),
								makeToolbarControl("output", {name: "Summary"}),
								makeSemanticAction({
									type: "camera",
									props: {type: "zoomTo", props: {}},
								}),
							],
							[
								{
									id: "action-menu",
									label: "Actions",
									items: [
										makeSemanticAction({
											type: "undo",
											props: {},
										}),
									],
								},
								{
									id: "widget-panel",
									label: "Info",
									widgets: [
										{type: "text", props: {text: "Hello"}},
									],
								},
							],
						],
					},
				},
			],
		});

		expect(result.success).toBe(true);
	});

	it("rejects an invalid toolbar side", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "mainToolbar",
						side: "middle",
					},
				},
			],
		});

		expect(result.success).toBe(false);
	});

	it("rejects an invalid toolbar align", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "mainToolbar",
						align: "left",
					},
				},
			],
		});

		expect(result.success).toBe(false);
	});

	it("rejects an invalid toolbar visibility", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "mainToolbar",
						visibility: "never",
					},
				},
			],
		});

		expect(result.success).toBe(false);
	});

	it("accepts viewport menu triggers as regular action item menus", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "viewportToolbar",
						groups: [
							[
								{
									label: "More options",
									items: [
										makeSemanticAction({
											type: "importParameterValues",
											props: {},
										}),
									],
								},
							],
						],
					},
				},
			],
		});

		expect(result.success).toBe(true);
	});

	it("accepts parameter/model-state utility actions and runtime camera assign actions", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "utilityActionsToolbar",
						groups: [
							[
								makeToolbarControl("action", {
									definition: {
										type: "importParameterValues",
										props: {},
									},
								}),
								makeToolbarControl("action", {
									definition: {
										type: "exportParameterValues",
										props: {},
									},
								}),
								makeToolbarControl("action", {
									definition: {
										type: "importModelState",
										props: {},
									},
								}),
								makeToolbarControl("action", {
									definition: {
										type: "camera",
										props: {
											type: "assign",
											viewportId: "vp1",
											props: {camera: {name: "cam1"}},
										},
									},
								}),
								{
									label: "Grouped camera actions",
									items: [
										[
											makeToolbarControl("action", {
												definition: {
													type: "camera",
													props: {
														type: "reset",
														props: {},
													},
												},
											}),
										],
										[
											makeToolbarControl("action", {
												definition: {
													type: "camera",
													props: {
														type: "zoomTo",
														props: {},
													},
												},
											}),
										],
									],
								},
							],
						],
					},
				},
			],
		});

		expect(result.success).toBe(true);
	});

	it("rejects legacy viewport actions", () => {
		const invalidKind = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "viewportToolbar",
						groups: [[makeLegacyViewportAction("pan")]],
					},
				},
			],
		});
		const legacyKind = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "viewportToolbar",
						groups: [[makeLegacyViewportAction("historyMenu")]],
					},
				},
			],
		});

		expect(invalidKind.success).toBe(false);
		expect(legacyKind.success).toBe(false);
	});

	it("rejects legacy viewportOperation controls", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{
					name: "toolbar",
					props: {
						id: "viewportToolbar",
						groups: [
							[
								makeToolbarControl("viewportOperation", {
									type: "zoom",
								}),
							],
						],
					},
				},
			],
		});

		expect(result.success).toBe(false);
	});

	it("keeps backward compatibility for existing non-toolbar containers", () => {
		const result = validateAppBuilder({
			version: "1.0",
			containers: [
				{name: "left", widgets: []},
				{
					name: "anchor2d",
					props: {
						id: "a2d",
						location: [0, 0],
					},
				},
				{
					name: "anchor3d",
					props: {
						id: "a3d",
						location: [0, 0, 0],
					},
				},
			],
		});

		expect(result.success).toBe(true);
	});
});

describe("toolbar settings schema", () => {
	it("accepts the public toolbar example", () => {
		const json = JSON.parse(
			readFileSync("public/example-toolbar-container.json", "utf8"),
		);

		const result = validateAppBuilderSettingsJson(json);

		expect(result.success).toBe(true);
	});

	it("accepts hideDefaultToolbar on session settings json", () => {
		const result = validateAppBuilderSettingsJson({
			version: "1.0",
			sessions: [
				{
					id: "main",
					hideDefaultToolbar: true,
				},
			],
		});

		expect(result.success).toBe(true);
	});
});
