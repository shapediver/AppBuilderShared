import {useShapeDiverStoreToolbars} from "../useShapeDiverStoreToolbars";

describe("useShapeDiverStoreToolbars", () => {
	beforeEach(() => {
		useShapeDiverStoreToolbars.setState({
			definitionToolbars: [],
			defaultToolbars: [],
			runtimeToolbars: [],
			runtimeTokens: {},
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
});
