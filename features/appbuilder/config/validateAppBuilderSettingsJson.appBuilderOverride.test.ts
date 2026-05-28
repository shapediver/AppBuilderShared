import * as fs from "node:fs";
import * as path from "node:path";
import {
	formatAppBuilderZodError,
	validateAppBuilderSettingsJson,
} from "./appbuildertypecheck";

const minimalValidSettings = {version: "1.0" as const};

describe("validateAppBuilderSettingsJson appBuilderOverride", () => {
	it("validates public/SS-9065.json", () => {
		const filePath = path.join(
			__dirname,
			"../../../../../public/SS-9065.json",
		);
		expect(fs.existsSync(filePath)).toBe(true);
		const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
		const result = validateAppBuilderSettingsJson(json);
		if (!result.success) {
			console.error(formatAppBuilderZodError(result.error));
		}
		expect(result.success).toBe(true);
	});

	it("accepts container stickyTabs and action props used in SS-9065", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
			appBuilderOverride: {
				version: "1.0",
				containers: [
					{
						name: "left",
						stickyTabs: true,
						widgets: [
							{
								type: "actions",
								props: {
									actions: [
										{
											type: "setParameterValues",
											props: {
												message: "Test",
												parameterValues: [
													{
														parameter: {name: "P"},
														value: "1",
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
		});
		expect(result.success).toBe(true);
	});

	it("accepts tooltip on addToCart inside control action definition.props", () => {
		const result = validateAppBuilderSettingsJson({
			...minimalValidSettings,
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
											type: "action",
											props: {
												definition: {
													type: "addToCart",
													props: {
														tooltip: "Add to cart",
														description: "Item",
													},
												},
											},
										},
									],
								},
							},
						],
					},
				],
			},
		});
		expect(result.success).toBe(true);
	});
});
