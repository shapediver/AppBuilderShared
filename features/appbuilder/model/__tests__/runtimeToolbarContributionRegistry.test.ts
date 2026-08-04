import {
	runtimeToolbarContributionRegistry,
} from "../runtimeToolbarContributionRegistry";

const contribution = (overrides = {}) => ({
	id: "contribution",
	namespace: "namespace",
	viewportId: "viewport",
	sectionId: "selection",
	menu: {id: "menu", label: "Menu", icon: "tabler:menu"},
	items: [{
		id: "command",
		type: "command" as const,
		label: "Command",
		props: {execute: jest.fn()},
	}],
	...overrides,
});

describe("runtimeToolbarContributionRegistry", () => {
	beforeEach(() => runtimeToolbarContributionRegistry.reset());
	afterEach(() => runtimeToolbarContributionRegistry.reset());

	it("keeps independently presented contributions within their viewport and namespace scope", () => {
		runtimeToolbarContributionRegistry.register(contribution());
		runtimeToolbarContributionRegistry.register(
			contribution({
				id: "other-menu",
				menu: {id: "other-menu", label: "Other menu"},
			}),
		);
		runtimeToolbarContributionRegistry.register(
			contribution({id: "other-viewport", viewportId: "other-viewport"}),
		);

		expect(
			runtimeToolbarContributionRegistry
				.select("viewport", "namespace")
				.map(({id, menu}) => ({id, menuId: menu.id})),
		).toEqual([
			{id: "contribution", menuId: "menu"},
			{id: "other-menu", menuId: "other-menu"},
		]);
	});

	it("updates presentation and items without changing contribution identity", () => {
		runtimeToolbarContributionRegistry.register(contribution());
		const items = [{
			id: "updated-command",
			type: "command" as const,
			label: "Updated command",
			props: {execute: jest.fn()},
		}];
		const menu = {id: "updated-menu", label: "Updated menu"};

		runtimeToolbarContributionRegistry.update("contribution", {items, menu});

		expect(
			runtimeToolbarContributionRegistry.select("viewport", "namespace")[0],
		).toMatchObject({id: "contribution", items, menu});
	});
});
