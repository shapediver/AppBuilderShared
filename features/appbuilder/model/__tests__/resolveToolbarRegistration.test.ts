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

	it("passes through command, checkbox, and acceptReject items", () => {
		const command = {
			id: "cmd",
			type: "command" as const,
			label: "Run",
			props: {execute: jest.fn()},
		};
		const checkbox = {
			id: "check",
			type: "checkbox" as const,
			label: "Flag",
			props: {checked: false, setChecked: jest.fn()},
		};
		const acceptReject = {
			id: "ar",
			type: "acceptReject" as const,
			label: "Accept",
			props: {},
		};

		const toolbar = resolveToolbarRegistration(
			baseToolbar([[command, checkbox, acceptReject]]),
		);

		expect(toolbar.groups[0][0]).toBe(command);
		expect(toolbar.groups[0][1]).toBe(checkbox);
		expect(toolbar.groups[0][2]).toBe(acceptReject);
	});

	it("resolves a standalone action using item fields over props", () => {
		const toolbar = resolveToolbarRegistration(
			baseToolbar([
				[
					{
						id: "undo",
						type: "action",
						label: "Item label",
						icon: "tabler:item",
						tooltip: "item tooltip",
						presentation: "button",
						props: {
							definition: {type: "undo", props: {}},
							label: "Props label",
							icon: "tabler:props",
							tooltip: "props tooltip",
						},
					},
				],
			]),
		);

		expect(toolbar.groups[0][0]).toEqual(
			expect.objectContaining({
				id: "undo",
				type: "action",
				label: "Item label",
				icon: "tabler:item",
				tooltip: "item tooltip",
				props: expect.objectContaining({
					label: "Item label",
					icon: "tabler:item",
					tooltip: "item tooltip",
					definition: {type: "undo", props: {}},
				}),
			}),
		);
	});

	it("resolves a standalone action from props when item fields are omitted", () => {
		const toolbar = resolveToolbarRegistration(
			baseToolbar([
				[
					{
						type: "action",
						props: {
							definition: {type: "redo", props: {}},
							label: "Props label",
							icon: "tabler:props",
							tooltip: "props tooltip",
						},
					},
				],
			]),
		);

		expect(toolbar.groups[0][0]).toEqual(
			expect.objectContaining({
				id: "toolbar-group-0-item-0",
				type: "action",
				label: "Props label",
				icon: "tabler:props",
				tooltip: "props tooltip",
			}),
		);
	});

	it("falls back to the action definition type when no labels exist", () => {
		const toolbar = resolveToolbarRegistration(
			baseToolbar([
				[
					{
						type: "action",
						props: {definition: {type: "undo", props: {}}},
					},
				],
			]),
		);

		expect(toolbar.groups[0][0]).toEqual(
			expect.objectContaining({
				label: "undo",
			}),
		);
	});

	it("resolves actionMenu ids and labels from the toolbar fallback", () => {
		const toolbar = resolveToolbarRegistration(
			baseToolbar([
				[
					{
						type: "actionMenu",
						props: {
							sections: [
								[
									{
										type: "action",
										props: {
											definition: {type: "undo", props: {}},
										},
									},
								],
							],
						},
					},
				],
			]),
		);

		const menu = toolbar.groups[0][0];
		expect(menu).toEqual(
			expect.objectContaining({
				id: "toolbar-group-0-item-0",
				type: "menu",
				label: "Toolbar item",
			}),
		);
		if (menu.type !== "menu") throw new Error("Expected a menu");
		expect(menu.props.sections[0].id).toBe(
			"toolbar-group-0-item-0-section-0",
		);
		expect(menu.props.sections[0].items[0].id).toBe(
			"toolbar-group-0-item-0-section-0-action-0",
		);
	});

	it("resolves parameter, export, output, widgets, and tabs items", () => {
		const toolbar = resolveToolbarRegistration(
			baseToolbar([
				[
					{
						type: "parameter",
						props: {name: "Width", delegates: []},
					},
					{
						id: "export-1",
						type: "export",
						label: "STL",
						props: {name: "stl"},
					},
					{
						type: "output",
						props: {name: "mesh"},
					},
					{
						type: "widgets",
						props: {widgets: []},
					},
					{
						id: "tabs-1",
						type: "tabs",
						props: {tabs: []},
					},
				],
			]),
		);

		expect(toolbar.groups[0].map((item) => item.type)).toEqual([
			"parameter",
			"export",
			"output",
			"widgets",
			"tabs",
		]);
		expect(toolbar.groups[0][0]).toEqual(
			expect.objectContaining({
				id: "toolbar-group-0-item-0",
				type: "parameter",
				label: "Width",
				props: {name: "Width", delegates: []},
			}),
		);
		expect(toolbar.groups[0][1]).toEqual(
			expect.objectContaining({
				id: "export-1",
				label: "STL",
			}),
		);
		expect(toolbar.groups[0][2]).toEqual(
			expect.objectContaining({
				id: "toolbar-group-0-item-2",
				label: "mesh",
			}),
		);
		expect(toolbar.groups[0][3]).toEqual(
			expect.objectContaining({
				id: "toolbar-group-0-item-3",
				label: "Toolbar item",
			}),
		);
		expect(toolbar.groups[0][4]).toEqual(
			expect.objectContaining({
				id: "tabs-1",
				label: "Toolbar item",
			}),
		);
	});
});
