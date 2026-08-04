import type {ToolbarMenuModel} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import type {ToolbarRegistration} from "@AppBuilderLib/features/appbuilder/config/shapediverStoreToolbars";
import {resolveToolbarRegistration} from "../resolveToolbarRegistration";

const baseToolbar = (groups: ToolbarRegistration["groups"]): ToolbarRegistration => ({
	id: "toolbar",
	source: "definition",
	side: "top",
	align: "center",
	order: 0,
	visibility: "always",
	groups,
});

describe("resolveToolbarRegistration", () => {
	it("resolves declarative action menus to generic menu sections", () => {
		const toolbar = resolveToolbarRegistration(
			baseToolbar([[{
				id: "actions",
				type: "actionMenu",
				label: "Actions",
				props: {
					sections: [[{
						id: "undo",
						type: "action",
						label: "Undo",
						props: {definition: {type: "undo", props: {}}},
					}]],
				},
			}]]),
		);

		const menu = toolbar.groups[0][0];
		expect(menu.type).toBe("menu");
		if (menu.type !== "menu") throw new Error("Expected a menu");
		expect(menu.props.sections).toEqual([
			expect.objectContaining({
				id: "actions-section-0",
				items: [
					expect.objectContaining({
						id: "undo",
						type: "action",
						label: "Undo",
					}),
				],
			}),
		]);
		if (menu.type === "menu") {
			expect(menu.props.sections[0].items[0]).not.toHaveProperty(
				"props.presentation",
			);
		}
	});

	it("preserves menus containing declarative actions and runtime commands", () => {
		const menu: ToolbarMenuModel = {
			id: "mixed-menu",
			type: "menu",
			label: "Mixed",
			props: {
				sections: [{
					id: "mixed-section",
					items: [
						{
							id: "redo",
							type: "action",
							label: "Redo",
							props: {definition: {type: "redo", props: {}}},
						},
						{
							id: "confirm",
							type: "command",
							label: "Confirm",
							props: {execute: jest.fn()},
						},
					],
				}],
			},
		};

		const toolbar = resolveToolbarRegistration(baseToolbar([[menu]]));
		expect(toolbar.groups[0][0]).toBe(menu);
	});
});
