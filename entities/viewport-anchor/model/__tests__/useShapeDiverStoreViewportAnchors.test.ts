/** @jest-environment jsdom */
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useShapeDiverStoreViewportAnchors} from "../useShapeDiverStoreViewportAnchors";

describe("useShapeDiverStoreViewportAnchors non-exclusive behavior", () => {
	const viewportId = "test-viewport";

	beforeEach(() => {
		useShapeDiverStoreViewportAnchors.setState({
			anchors: {},
			dragOffsetMap: {},
		});
	});

	it("closes other exclusive anchors when an exclusive anchor is opened", () => {
		const store = useShapeDiverStoreViewportAnchors.getState();

		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor2d,
			id: "scene-1",
			showContent: true,
			hideable: true,
			exclusive: true,
		});

		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor2d,
			id: "scene-2",
			showContent: false,
			hideable: true,
			exclusive: true,
		});

		expect(
			useShapeDiverStoreViewportAnchors
				.getState()
				.anchors[viewportId].find((a) => a.id === "scene-1")
				?.showContent,
		).toBe(true);

		// Open scene-2
		store.updateShowContent(viewportId, "scene-2", true);

		const updated =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		expect(updated.find((a) => a.id === "scene-2")?.showContent).toBe(true);
		expect(updated.find((a) => a.id === "scene-1")?.showContent).toBe(
			false,
		);
	});

	it("does not close non-exclusive anchors when an exclusive anchor opens", () => {
		const store = useShapeDiverStoreViewportAnchors.getState();

		// Add a non-exclusive action-targeted anchor and open it
		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor2d,
			id: "action-anchor",
			showContent: true,
			hideable: true,
			exclusive: false,
		});

		// Add an in-scene anchor (exclusive: true)
		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor2d,
			id: "scene-anchor",
			showContent: false,
			hideable: true,
			exclusive: true,
		});

		// Open the scene anchor
		store.updateShowContent(viewportId, "scene-anchor", true);

		const updated =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		expect(updated.find((a) => a.id === "scene-anchor")?.showContent).toBe(
			true,
		);
		// Action-targeted anchor should remain open
		expect(updated.find((a) => a.id === "action-anchor")?.showContent).toBe(
			true,
		);
	});

	it("does not close other anchors when a non-exclusive anchor opens", () => {
		const store = useShapeDiverStoreViewportAnchors.getState();

		// Add an in-scene anchor (exclusive: true) and open it
		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor2d,
			id: "scene-anchor",
			showContent: true,
			hideable: true,
			exclusive: true,
		});

		// Add a non-exclusive action-targeted anchor
		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor2d,
			id: "action-anchor",
			showContent: false,
			hideable: true,
			exclusive: false,
		});

		// Open the action-targeted anchor
		store.updateShowContent(viewportId, "action-anchor", true);

		const updated =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		// Both should be open!
		expect(updated.find((a) => a.id === "scene-anchor")?.showContent).toBe(
			true,
		);
		expect(updated.find((a) => a.id === "action-anchor")?.showContent).toBe(
			true,
		);
	});

	it("supports non-exclusive 3D anchors", () => {
		const store = useShapeDiverStoreViewportAnchors.getState();

		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor3d,
			id: "scene-3d-exclusive",
			showContent: true,
			hideable: true,
			exclusive: true,
			zIndex: 0,
		});

		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor3d,
			id: "action-3d-non-exclusive",
			showContent: false,
			hideable: true,
			exclusive: false,
			zIndex: 1,
		});

		// Open non-exclusive 3D anchor
		store.updateShowContent(viewportId, "action-3d-non-exclusive", true);

		let updated =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		expect(
			updated.find((a) => a.id === "scene-3d-exclusive")?.showContent,
		).toBe(true);
		expect(
			updated.find((a) => a.id === "action-3d-non-exclusive")
				?.showContent,
		).toBe(true);

		// Now open another exclusive 3D anchor
		store.addAnchor(viewportId, {
			type: AppBuilderContainerNameType.Anchor3d,
			id: "scene-3d-exclusive-2",
			showContent: false,
			hideable: true,
			exclusive: true,
			zIndex: 2,
		});

		store.updateShowContent(viewportId, "scene-3d-exclusive-2", true);

		updated =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		expect(
			updated.find((a) => a.id === "scene-3d-exclusive-2")?.showContent,
		).toBe(true);
		// Previous exclusive anchor should be closed
		expect(
			updated.find((a) => a.id === "scene-3d-exclusive")?.showContent,
		).toBe(false);
		// Non-exclusive anchor remains open!
		expect(
			updated.find((a) => a.id === "action-3d-non-exclusive")
				?.showContent,
		).toBe(true);
	});
});
