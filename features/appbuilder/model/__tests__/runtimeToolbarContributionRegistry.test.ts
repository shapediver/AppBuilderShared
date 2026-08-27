import {runtimeToolbarContributionRegistry} from "../runtimeToolbarContributionRegistry";

const contribution = (overrides = {}) => ({
	id: "contribution",
	namespace: "namespace",
	viewportId: "viewport",
	sectionId: "selection",
	menu: {id: "menu", label: "Menu", icon: "tabler:menu"},
	items: [
		{
			id: "command",
			type: "command" as const,
			label: "Command",
			props: {execute: jest.fn()},
		},
	],
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
		const items = [
			{
				id: "updated-command",
				type: "command" as const,
				label: "Updated command",
				props: {execute: jest.fn()},
			},
		];
		const menu = {id: "updated-menu", label: "Updated menu"};

		runtimeToolbarContributionRegistry.update("contribution", {
			items,
			menu,
		});

		expect(
			runtimeToolbarContributionRegistry.select(
				"viewport",
				"namespace",
			)[0],
		).toMatchObject({id: "contribution", items, menu});
	});

	it("sorts contributions by parameter order before their stable identity", () => {
		runtimeToolbarContributionRegistry.register(
			contribution({id: "later", order: 20}),
		);
		runtimeToolbarContributionRegistry.register(
			contribution({id: "earlier", order: 10}),
		);

		expect(
			runtimeToolbarContributionRegistry
				.select("viewport", "namespace")
				.map(({id}) => id),
		).toEqual(["earlier", "later"]);
	});

	it("keeps a contribution until every instance with the same id unmounts", () => {
		const first =
			runtimeToolbarContributionRegistry.register(contribution());
		const second =
			runtimeToolbarContributionRegistry.register(contribution());

		runtimeToolbarContributionRegistry.unregister("contribution", second);
		expect(
			runtimeToolbarContributionRegistry.select("viewport", "namespace"),
		).toHaveLength(1);

		runtimeToolbarContributionRegistry.unregister("contribution", first);
		expect(
			runtimeToolbarContributionRegistry.select("viewport", "namespace"),
		).toEqual([]);
	});

	it("notifies subscribers and stops after unsubscribe", () => {
		const listener = jest.fn();
		const unsubscribe = runtimeToolbarContributionRegistry.subscribe(listener);

		runtimeToolbarContributionRegistry.register(contribution());
		expect(listener).toHaveBeenCalledTimes(1);
		expect(runtimeToolbarContributionRegistry.getSnapshot()).toEqual(
			expect.objectContaining({
				contribution: expect.objectContaining({id: "contribution"}),
			}),
		);

		runtimeToolbarContributionRegistry.update("contribution", {order: 4});
		expect(listener).toHaveBeenCalledTimes(2);

		unsubscribe();
		runtimeToolbarContributionRegistry.register(
			contribution({id: "other", menu: {id: "other", label: "Other"}}),
		);
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("notifies subscribers on unregister and reset", () => {
		runtimeToolbarContributionRegistry.register(contribution());
		const listener = jest.fn();
		runtimeToolbarContributionRegistry.subscribe(listener);

		runtimeToolbarContributionRegistry.unregister("contribution");
		expect(listener).toHaveBeenCalledTimes(1);

		runtimeToolbarContributionRegistry.register(contribution());
		runtimeToolbarContributionRegistry.reset();
		expect(listener).toHaveBeenCalledTimes(3);
	});

	it("patches only the token instance when a registration token is provided", () => {
		const first = runtimeToolbarContributionRegistry.register(contribution());
		const second = runtimeToolbarContributionRegistry.register(
			contribution(),
		);
		const patchedMenu = {id: "patched", label: "Patched"};

		runtimeToolbarContributionRegistry.update(
			"contribution",
			{menu: patchedMenu},
			first,
		);

		expect(
			runtimeToolbarContributionRegistry.select("viewport", "namespace")[0]
				.menu,
		).toEqual({id: "menu", label: "Menu", icon: "tabler:menu"});

		runtimeToolbarContributionRegistry.unregister("contribution", second);
		expect(
			runtimeToolbarContributionRegistry.select("viewport", "namespace")[0]
				.menu,
		).toEqual(patchedMenu);
	});

	it("ignores update and unregister for unknown ids", () => {
		runtimeToolbarContributionRegistry.register(contribution());
		const before = runtimeToolbarContributionRegistry.select(
			"viewport",
			"namespace",
		);

		runtimeToolbarContributionRegistry.update("missing", {order: 1});
		runtimeToolbarContributionRegistry.unregister("missing");

		expect(
			runtimeToolbarContributionRegistry.select("viewport", "namespace"),
		).toEqual(before);
	});

	it("ignores token updates that do not match a registration", () => {
		runtimeToolbarContributionRegistry.register(contribution());
		runtimeToolbarContributionRegistry.update(
			"contribution",
			{order: 99},
			Symbol("missing"),
		);

		expect(
			runtimeToolbarContributionRegistry.select("viewport", "namespace")[0]
				.order,
		).toBeUndefined();
	});

	it("clears every instance when unregister is called without a token", () => {
		runtimeToolbarContributionRegistry.register(contribution());
		runtimeToolbarContributionRegistry.register(contribution());

		runtimeToolbarContributionRegistry.unregister("contribution");

		expect(
			runtimeToolbarContributionRegistry.select("viewport", "namespace"),
		).toEqual([]);
	});

	it("keeps other contribution ids when one id is unregistered", () => {
		runtimeToolbarContributionRegistry.register(contribution());
		runtimeToolbarContributionRegistry.register(
			contribution({
				id: "kept",
				menu: {id: "kept", label: "Kept"},
			}),
		);

		runtimeToolbarContributionRegistry.unregister("contribution");

		expect(
			runtimeToolbarContributionRegistry
				.select("viewport", "namespace")
				.map(({id}) => id),
		).toEqual(["kept"]);
	});

	it("filters by namespace and sorts missing order after numbered order", () => {
		runtimeToolbarContributionRegistry.register(
			contribution({id: "zeta", order: 1}),
		);
		runtimeToolbarContributionRegistry.register(
			contribution({id: "alpha"}),
		);
		runtimeToolbarContributionRegistry.register(
			contribution({
				id: "other-ns",
				namespace: "other",
				order: 0,
			}),
		);

		expect(
			runtimeToolbarContributionRegistry
				.select("viewport", "namespace")
				.map(({id}) => id),
		).toEqual(["zeta", "alpha"]);
		expect(
			runtimeToolbarContributionRegistry.select("viewport", "other"),
		).toHaveLength(1);
	});

	it("breaks equal order ties by contribution id", () => {
		runtimeToolbarContributionRegistry.register(
			contribution({id: "b", order: 1}),
		);
		runtimeToolbarContributionRegistry.register(
			contribution({id: "a", order: 1}),
		);

		expect(
			runtimeToolbarContributionRegistry
				.select("viewport", "namespace")
				.map(({id}) => id),
		).toEqual(["a", "b"]);
	});
});
