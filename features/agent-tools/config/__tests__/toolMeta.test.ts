import {AGENT_TOOL_META} from "../toolMeta";

const noArgumentTools = [
	"list_parameter_definitions",
	"list_action_controls",
	"get_metric",
] as const;

describe("AGENT_TOOL_META", () => {
	it.each(noArgumentTools)(
		"%s description does not invite arguments",
		(name) => {
			const description = AGENT_TOOL_META[name].description;
			expect(description).toMatch(/no arguments/i);
			expect(description).not.toMatch(/\binput\b/i);
			expect(description).not.toMatch(/extra keys/i);
		},
	);

	it.each(["set_camera_position", "get_screenshot"] as const)(
		"%s description does not mention viewportId",
		(name) => {
			expect(AGENT_TOOL_META[name].description).not.toMatch(
				/viewportId/i,
			);
		},
	);

	it("get_screenshot describes image_url and optional capture options", () => {
		const description = AGENT_TOOL_META.get_screenshot.description;
		expect(description).toMatch(/image_url/);
		expect(description).toMatch(/contentType/);
		expect(description).toMatch(/quality/);
		expect(description).toMatch(/resolution/);
		expect(description).not.toMatch(/success:\s*true,\s*image\s*[},]/i);
	});
});
