import {useShapeDiverStoreToolbars} from "../useShapeDiverStoreToolbars";

describe("useShapeDiverStoreToolbars", () => {
	beforeEach(() => {
		useShapeDiverStoreToolbars.setState({
			definitionToolbars: [],
			defaultToolbars: [],
			runtimeToolbars: [],
			runtimeTokens: {},
			toolbarOpen: {},
		});
	});

	it("loads and resets definition toolbars without clearing runtime state", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefinitionToolbars([
			{
				id: "main",
				source: "definition",
				side: "top",
				align: "center",
				order: 1,
				visibility: "always",
				groups: [],
			},
		]);
		const token = store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "camera",
							props: {type: "zoomTo", props: {}},
						},
					},
				},
			],
		);
		expect(
			useShapeDiverStoreToolbars.getState().definitionToolbars,
		).toHaveLength(1);
		expect(token).toBeDefined();
		store.resetDefinitionToolbars();
		expect(
			useShapeDiverStoreToolbars.getState().definitionToolbars,
		).toHaveLength(0);
		expect(useShapeDiverStoreToolbars.getState().runtimeTokens).toHaveProperty(
			token!,
		);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars,
		).toHaveLength(1);
	});

	it("registers and removes default toolbars by id", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefaultToolbar({
			id: "default",
			source: "default",
			side: "top",
			align: "center",
			order: 0,
			visibility: "onMouseActivity",
			groups: [],
		});
		expect(store.selectMergedToolbars()).toHaveLength(1);
		store.removeDefaultToolbar("default");
		expect(
			useShapeDiverStoreToolbars.getState().selectMergedToolbars(),
		).toHaveLength(0);
	});

	it("adds runtime controls and removes runtime-only toolbar when token is removed", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const token = store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "camera",
							props: {type: "zoomTo", props: {}},
						},
					},
				},
			],
		);

		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars,
		).toHaveLength(1);
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.removeRuntimeToolbarToken(token),
		).toBe(true);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars,
		).toHaveLength(0);
	});

	it("removes only the runtime item occurrences owned by a token", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const sharedControl = {
			type: "action" as const,
			props: {
				definition: {
					type: "camera" as const,
					props: {type: "zoomTo" as const, props: {}},
				},
			},
		};
		const target = {
			fallbackSide: "top" as const,
			fallbackAlign: "center" as const,
			createIfMissing: true,
		};

		const first = store.addRuntimeToolbarControls(target, [sharedControl]);
		const second = store.addRuntimeToolbarControls(target, [sharedControl]);

		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[0],
		).toHaveLength(2);
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.removeRuntimeToolbarToken(first!),
		).toBe(true);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[0],
		).toEqual([sharedControl]);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeTokens,
		).toHaveProperty(second!);
	});

	it("keeps runtime group indexes stable when earlier groups are removed", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const first = store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
				groupIndex: 0,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "camera",
							props: {type: "zoomTo", props: {}},
						},
					},
				},
			],
		);
		const second = store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
				groupIndex: 1,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "resetParameterValues",
							props: {},
						},
					},
				},
			],
		);

		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups,
		).toHaveLength(2);
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.removeRuntimeToolbarToken(first),
		).toBe(true);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[0],
		).toEqual([]);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[1],
		).toHaveLength(1);
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.removeRuntimeToolbarToken(second),
		).toBe(true);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars,
		).toHaveLength(0);
	});

	it("sorts merged toolbars by order and definition index", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefinitionToolbars([
			{
				id: "second",
				source: "definition",
				side: "top",
				align: "center",
				order: 2,
				visibility: "always",
				groups: [],
			},
			{
				id: "first",
				source: "definition",
				side: "top",
				align: "center",
				order: 1,
				visibility: "always",
				groups: [],
			},
		]);
		store.setDefaultToolbar({
			id: "default",
			source: "default",
			side: "top",
			align: "center",
			order: 1,
			visibility: "always",
			groups: [],
		});

		expect(
			store.selectMergedToolbars().map((toolbar) => toolbar.id),
		).toEqual(["first", "default", "second"]);
	});

	it("respects createIfMissing=false for missing toolbar ids", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const token = store.addRuntimeToolbarControls(
			{
				toolbarId: "missing",
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: false,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "camera",
							props: {type: "zoomTo", props: {}},
						},
					},
				},
			],
		);

		expect(token).toBeUndefined();
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars,
		).toHaveLength(0);
	});

	it("respects createIfMissing=false for missing fallback slots", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const token = store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: false,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "camera",
							props: {type: "zoomTo", props: {}},
						},
					},
				},
			],
		);

		expect(token).toBeUndefined();
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars,
		).toHaveLength(0);
	});

	it("filters merged toolbars by viewport id", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefinitionToolbars([
			{
				id: "global",
				source: "definition",
				side: "top",
				align: "center",
				order: 0,
				visibility: "always",
				groups: [],
			},
			{
				id: "vp1-only",
				source: "definition",
				viewportId: "vp1",
				side: "top",
				align: "center",
				order: 0,
				visibility: "always",
				groups: [],
			},
		]);

		expect(
			store.selectMergedToolbars("vp1").map((toolbar) => toolbar.id),
		).toEqual(["global", "vp1-only"]);
		expect(
			store.selectMergedToolbars("vp2").map((toolbar) => toolbar.id),
		).toEqual(["global"]);
	});

	it("clones toolbar groups when normalizing store input", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const inputGroups = [[
			{
				type: "action" as const,
				props: {
					definition: {
						type: "resetParameterValues" as const,
						props: {},
					},
				},
			},
		]];

		store.setDefinitionToolbars([
			{
				id: "main",
				source: "definition",
				side: "top",
				align: "center",
				order: 0,
				visibility: "always",
				groups: inputGroups,
			},
		]);

		inputGroups[0].push({
			type: "action",
			props: {
				definition: {
					type: "redo",
					props: {},
				},
			},
		});

		expect(
			useShapeDiverStoreToolbars.getState().definitionToolbars[0].groups[0],
		).toHaveLength(1);
	});

	const defaultToolbar = (overrides: Record<string, unknown> = {}) => ({
		id: "default",
		source: "default" as const,
		side: "top" as const,
		align: "center" as const,
		order: 0,
		visibility: "always" as const,
		groups: [] as const,
		...overrides,
	});

	it("defaults omitted side, align, visibility, source, and groups", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefinitionToolbars([
			{
				id: "main",
			} as Parameters<typeof store.setDefinitionToolbars>[0][number],
		]);

		expect(
			useShapeDiverStoreToolbars.getState().definitionToolbars[0],
		).toEqual(
			expect.objectContaining({
				id: "main",
				source: "definition",
				side: "top",
				align: "center",
				visibility: "always",
				order: 0,
				groups: [],
			}),
		);
	});

	it("keeps the default toolbar list identity when upserting equal data", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const item = {
			type: "action" as const,
			props: {definition: {type: "undo" as const, props: {}}},
		};
		store.setDefaultToolbar(defaultToolbar({groups: [[item]]}));
		const first = useShapeDiverStoreToolbars.getState().defaultToolbars;
		store.setDefaultToolbar(defaultToolbar({groups: [[item]]}));
		expect(useShapeDiverStoreToolbars.getState().defaultToolbars).toBe(first);

		store.setDefaultToolbar(defaultToolbar({id: "other"}));
		const withTwo = useShapeDiverStoreToolbars.getState().defaultToolbars;
		store.setDefaultToolbar(defaultToolbar({id: "other"}));
		expect(useShapeDiverStoreToolbars.getState().defaultToolbars).toBe(
			withTwo,
		);
	});

	it("replaces a default toolbar when a field changes", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefaultToolbar(defaultToolbar());

		store.setDefaultToolbar(defaultToolbar({side: "bottom"}));
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].side,
		).toBe("bottom");

		store.setDefaultToolbar(defaultToolbar({side: "bottom", align: "end"}));
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].align,
		).toBe("end");

		store.setDefaultToolbar(
			defaultToolbar({side: "bottom", align: "end", order: 4}),
		);
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].order,
		).toBe(4);

		store.setDefaultToolbar(
			defaultToolbar({
				side: "bottom",
				align: "end",
				order: 4,
				visibility: "onMouseActivity",
			}),
		);
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].visibility,
		).toBe("onMouseActivity");

		store.setDefaultToolbar(
			defaultToolbar({
				side: "bottom",
				align: "end",
				order: 4,
				visibility: "onMouseActivity",
				ariaLabel: "A",
			}),
		);
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].ariaLabel,
		).toBe("A");

		store.setDefaultToolbar(
			defaultToolbar({
				side: "bottom",
				align: "end",
				order: 4,
				visibility: "onMouseActivity",
				ariaLabel: "A",
				defaultIcon: "tabler:icon",
			}),
		);
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].defaultIcon,
		).toBe("tabler:icon");

		store.setDefaultToolbar(
			defaultToolbar({
				side: "bottom",
				align: "end",
				order: 4,
				visibility: "onMouseActivity",
				ariaLabel: "A",
				defaultIcon: "tabler:icon",
				viewportId: "vp1",
				definitionIndex: 2,
			}),
		);
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].viewportId,
		).toBe("vp1");
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].definitionIndex,
		).toBe(2);

		store.setDefaultToolbar(
			defaultToolbar({
				side: "bottom",
				align: "end",
				order: 4,
				visibility: "onMouseActivity",
				ariaLabel: "A",
				defaultIcon: "tabler:icon",
				viewportId: "vp2",
				definitionIndex: 2,
			}),
		);
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].viewportId,
		).toBe("vp2");

		store.setDefaultToolbar(
			defaultToolbar({
				side: "bottom",
				align: "end",
				order: 4,
				visibility: "onMouseActivity",
				ariaLabel: "A",
				defaultIcon: "tabler:icon",
				viewportId: "vp2",
				definitionIndex: 3,
			}),
		);
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].definitionIndex,
		).toBe(3);

		const itemA = {
			type: "action" as const,
			props: {definition: {type: "undo" as const, props: {}}},
		};
		const itemB = {
			type: "action" as const,
			props: {definition: {type: "redo" as const, props: {}}},
		};
		store.setDefaultToolbar(
			defaultToolbar({
				side: "bottom",
				align: "end",
				order: 4,
				visibility: "onMouseActivity",
				ariaLabel: "A",
				defaultIcon: "tabler:icon",
				viewportId: "vp2",
				definitionIndex: 3,
				groups: [[itemA, itemA]],
			}),
		);
		store.setDefaultToolbar(
			defaultToolbar({
				side: "bottom",
				align: "end",
				order: 4,
				visibility: "onMouseActivity",
				ariaLabel: "A",
				defaultIcon: "tabler:icon",
				viewportId: "vp2",
				definitionIndex: 3,
				groups: [[itemA, itemB]],
			}),
		);
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0].groups[0],
		).toEqual([itemA, itemB]);
	});

	it("hides merged toolbars when setToolbarOpen is false", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefaultToolbar(defaultToolbar());
		expect(store.selectMergedToolbars()).toHaveLength(1);

		store.setToolbarOpen("default", false);
		expect(store.selectMergedToolbars()).toHaveLength(0);
		expect(
			useShapeDiverStoreToolbars.getState().definitionToolbars,
		).toEqual([]);

		store.setToolbarOpen("default", true);
		expect(store.selectMergedToolbars()).toHaveLength(1);
	});

	it("returns false when removing an unknown runtime token", () => {
		const store = useShapeDiverStoreToolbars.getState();
		expect(store.removeRuntimeToolbarToken("missing")).toBe(false);
	});

	it("is a no-op when removing a missing default toolbar id", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefaultToolbar(defaultToolbar());
		const before = useShapeDiverStoreToolbars.getState().defaultToolbars;

		store.removeDefaultToolbar("missing");
		expect(useShapeDiverStoreToolbars.getState().defaultToolbars).toBe(
			before,
		);
	});

	it("removes one default toolbar without dropping siblings", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefaultToolbar(defaultToolbar({id: "keep"}));
		store.setDefaultToolbar(defaultToolbar({id: "drop"}));
		store.removeDefaultToolbar("drop");
		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars.map(
				(toolbar) => toolbar.id,
			),
		).toEqual(["keep"]);
	});

	it("sorts same-order toolbars by definitionIndex then id", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.setDefinitionToolbars([
			{
				id: "high",
				source: "definition",
				side: "top",
				align: "center",
				order: 0,
				definitionIndex: 5,
				visibility: "always",
				groups: [],
			},
			{
				id: "low",
				source: "definition",
				side: "top",
				align: "center",
				order: 0,
				definitionIndex: 1,
				visibility: "always",
				groups: [],
			},
		]);

		expect(
			store.selectMergedToolbars().map((toolbar) => toolbar.id),
		).toEqual(["low", "high"]);

		store.setDefaultToolbar(defaultToolbar({id: "plain", order: 0}));
		expect(
			store.selectMergedToolbars().map((toolbar) => toolbar.id),
		).toEqual(["low", "high", "plain"]);

		store.setDefaultToolbar(defaultToolbar({id: "plain-first", order: 7}));
		store.setDefaultToolbar(
			defaultToolbar({id: "indexed-second", order: 7, definitionIndex: 0}),
		);
		expect(
			store
				.selectMergedToolbars()
				.filter((toolbar) => toolbar.order === 7)
				.map((toolbar) => toolbar.id),
		).toEqual(["indexed-second", "plain-first"]);

		store.setDefaultToolbar(defaultToolbar({id: "zeta", order: 8}));
		store.setDefaultToolbar(defaultToolbar({id: "alpha", order: 8}));
		expect(
			store
				.selectMergedToolbars()
				.filter((toolbar) => toolbar.order === 8)
				.map((toolbar) => toolbar.id),
		).toEqual(["alpha", "zeta"]);
	});

	it("adds runtime controls to an existing toolbar id", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const first = store.addRuntimeToolbarControls(
			{
				toolbarId: "runtime-main",
				fallbackSide: "bottom",
				fallbackAlign: "start",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "camera",
							props: {type: "zoomTo", props: {}},
						},
					},
				},
			],
		);
		const second = store.addRuntimeToolbarControls(
			{
				toolbarId: "runtime-main",
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: false,
			},
			[
				{
					type: "action",
					props: {
						definition: {
							type: "resetParameterValues",
							props: {},
						},
					},
				},
			],
		);

		expect(first).toBeDefined();
		expect(second).toBeDefined();
		const runtime = useShapeDiverStoreToolbars.getState().runtimeToolbars;
		expect(runtime).toHaveLength(1);
		expect(runtime[0].id).toBe("runtime-main");
		expect(runtime[0].side).toBe("bottom");
		expect(runtime[0].groups[0]).toHaveLength(2);
	});

	it("adds runtime controls only to the targeted toolbar id", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const control = {
			type: "action" as const,
			props: {definition: {type: "undo" as const, props: {}}},
		};
		store.addRuntimeToolbarControls(
			{
				toolbarId: "one",
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
			},
			[control],
		);
		store.addRuntimeToolbarControls(
			{
				toolbarId: "two",
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
			},
			[control],
		);
		const extra = {
			type: "action" as const,
			props: {
				definition: {type: "redo" as const, props: {}},
			},
		};
		store.addRuntimeToolbarControls(
			{
				toolbarId: "two",
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: false,
			},
			[extra],
		);

		const runtime = useShapeDiverStoreToolbars.getState().runtimeToolbars;
		expect(
			runtime.find((toolbar) => toolbar.id === "one")?.groups[0],
		).toHaveLength(1);
		expect(
			runtime.find((toolbar) => toolbar.id === "two")?.groups[0],
		).toHaveLength(2);

		const twoToken = Object.entries(
			useShapeDiverStoreToolbars.getState().runtimeTokens,
		).find(([, entry]) => entry.toolbarId === "two")?.[0];
		expect(
			store.removeRuntimeToolbarToken(twoToken!),
		).toBe(true);
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.runtimeToolbars.find((toolbar) => toolbar.id === "one")
				?.groups[0],
		).toHaveLength(1);
	});

	it("picks the matching fallback slot among multiple runtime toolbars", () => {
		const store = useShapeDiverStoreToolbars.getState();
		store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "start",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {type: "undo", props: {}},
					},
				},
			],
		);
		store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "end",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {type: "redo", props: {}},
					},
				},
			],
		);
		store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "end",
				createIfMissing: false,
			},
			[
				{
					type: "action",
					props: {
						definition: {type: "resetParameterValues", props: {}},
					},
				},
			],
		);

		store.addRuntimeToolbarControls(
			{
				fallbackSide: "bottom",
				fallbackAlign: "start",
				createIfMissing: true,
			},
			[
				{
					type: "action",
					props: {
						definition: {type: "resetParameterValues", props: {}},
					},
				},
			],
		);
		store.addRuntimeToolbarControls(
			{
				fallbackSide: "bottom",
				fallbackAlign: "start",
				createIfMissing: false,
			},
			[
				{
					type: "action",
					props: {
						definition: {type: "redo", props: {}},
					},
				},
			],
		);

		const runtime = useShapeDiverStoreToolbars.getState().runtimeToolbars;
		const endToolbar = runtime.find(
			(toolbar) => toolbar.side === "top" && toolbar.align === "end",
		);
		expect(endToolbar?.groups[0]).toHaveLength(2);
		expect(
			runtime.find(
				(toolbar) => toolbar.side === "top" && toolbar.align === "start",
			)?.groups[0],
		).toHaveLength(1);
		expect(
			runtime.find(
				(toolbar) =>
					toolbar.side === "bottom" && toolbar.align === "start",
			)?.groups[0],
		).toHaveLength(2);
	});

	it("keeps a toolbar when only some groups become empty", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const item = {
			type: "action" as const,
			props: {
				definition: {type: "undo" as const, props: {}},
			},
		};
		const first = store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
				groupIndex: 0,
			},
			[item],
		);
		store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
				groupIndex: 2,
			},
			[item],
		);

		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups,
		).toHaveLength(3);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[0],
		).toHaveLength(1);
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.removeRuntimeToolbarToken(first!),
		).toBe(true);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[0],
		).toEqual([]);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[2],
		).toHaveLength(1);
	});

	it("preserves runtime order when appending to an existing toolbar", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const item = {
			type: "action" as const,
			props: {definition: {type: "undo" as const, props: {}}},
		};
		store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: true,
				order: 5,
			},
			[item],
		);
		store.addRuntimeToolbarControls(
			{
				fallbackSide: "top",
				fallbackAlign: "center",
				createIfMissing: false,
			},
			[item],
		);
		expect(useShapeDiverStoreToolbars.getState().runtimeToolbars[0].order).toBe(
			5,
		);
	});

	it("removes only the matching runtime item when items differ", () => {
		const store = useShapeDiverStoreToolbars.getState();
		const firstItem = {
			type: "action" as const,
			props: {definition: {type: "undo" as const, props: {}}},
		};
		const secondItem = {
			type: "action" as const,
			props: {definition: {type: "redo" as const, props: {}}},
		};
		const target = {
			fallbackSide: "top" as const,
			fallbackAlign: "center" as const,
			createIfMissing: true,
		};
		store.addRuntimeToolbarControls(target, [firstItem]);
		const second = store.addRuntimeToolbarControls(target, [secondItem]);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[0],
		).toEqual([firstItem, secondItem]);
		expect(store.removeRuntimeToolbarToken(second!)).toBe(true);
		expect(
			useShapeDiverStoreToolbars.getState().runtimeToolbars[0].groups[0],
		).toEqual([firstItem]);
	});
});
