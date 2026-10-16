/** @jest-environment jsdom */
import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {runAppBuilderActionSetContainerVisibility} from "../runAppBuilderActionSetContainerVisibility";

describe("runAppBuilderActionSetContainerVisibility", () => {
	const viewportId = "test-viewport";

	beforeEach(() => {
		useShapeDiverStoreStandardContainers.setState({
			containerOpen: {
				left: true,
				right: false,
				top: false,
				bottom: false,
			},
		});
		useShapeDiverStoreViewportAnchors.setState({
			anchors: {
				[viewportId]: [
					{
						type: AppBuilderContainerNameType.Anchor2d,
						id: "test-anchor",
						showContent: false,
						hideable: true,
						exclusive: false,
					},
				],
			},
			dragOffsetMap: {},
		});
		useShapeDiverStoreToolbars.setState({
			toolbarOpen: {
				"test-toolbar": true,
			},
		});
	});

	it("controls standard containers visibility", () => {
		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Right,
			},
			mode: "toggle",
			viewportId,
		});

		expect(
			useShapeDiverStoreStandardContainers.getState().containerOpen.right,
		).toBe(true);
	});

	it("controls 2d viewport anchor visibility", () => {
		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "test-anchor"},
			},
			mode: "toggle",
			viewportId,
		});

		const anchor = useShapeDiverStoreViewportAnchors
			.getState()
			.anchors[viewportId].find((a) => a.id === "test-anchor");
		expect(anchor?.showContent).toBe(true);
	});

	it("controls 3d viewport anchor visibility", () => {
		useShapeDiverStoreViewportAnchors.setState({
			anchors: {
				[viewportId]: [
					{
						type: AppBuilderContainerNameType.Anchor3d,
						id: "test-3d-anchor",
						showContent: false,
						hideable: true,
						exclusive: false,
						zIndex: 0,
					},
				],
			},
			dragOffsetMap: {},
		});

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor3d,
				props: {id: "test-3d-anchor"},
			},
			mode: "toggle",
			viewportId,
		});

		const anchor = useShapeDiverStoreViewportAnchors
			.getState()
			.anchors[viewportId].find((a) => a.id === "test-3d-anchor");
		expect(anchor?.showContent).toBe(true);
	});

	it("closes toolbar siblings from a click and keeps the sequence anchors", () => {
		useShapeDiverStoreViewportAnchors.setState({
			anchors: {
				[viewportId]: ["panel-a", "panel-b", "panel-c"].map((id) => ({
					type: AppBuilderContainerNameType.Anchor2d,
					id,
					showContent: id !== "panel-a",
					hideable: true,
					exclusive: false,
				})),
			},
			dragOffsetMap: {},
		});
		const button = document.createElement("button");

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-a"},
			},
			mode: "open",
			viewportId,
			actionHost: {
				element: button,
				exclusiveContainers: true,
				siblingAnchorIds: ["panel-a", "panel-b", "panel-c"],
				actions: [
					{
						type: "setContainerVisibility",
						props: {
							mode: "open",
							container: {
								name: AppBuilderContainerNameType.Anchor2d,
								props: {id: "panel-a"},
							},
						},
					},
					{
						type: "setContainerVisibility",
						props: {
							mode: "open",
							container: {
								name: AppBuilderContainerNameType.Anchor2d,
								props: {id: "panel-b"},
							},
						},
					},
				],
			},
		});

		const anchors =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		expect(
			anchors.find((anchor) => anchor.id === "panel-a")?.showContent,
		).toBe(true);
		expect(
			anchors.find((anchor) => anchor.id === "panel-b")?.showContent,
		).toBe(true);
		expect(
			anchors.find((anchor) => anchor.id === "panel-c")?.showContent,
		).toBe(false);
	});

	it("leaves other anchors open when a selection runs without a click", () => {
		useShapeDiverStoreViewportAnchors.setState({
			anchors: {
				[viewportId]: ["panel-a", "panel-b"].map((id) => ({
					type: AppBuilderContainerNameType.Anchor2d,
					id,
					showContent: id === "panel-b",
					hideable: true,
					exclusive: false,
				})),
			},
			dragOffsetMap: {},
		});

		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Anchor2d,
				props: {id: "panel-a"},
			},
			mode: "open",
			viewportId,
		});

		const anchors =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		expect(
			anchors.find((anchor) => anchor.id === "panel-a")?.showContent,
		).toBe(true);
		expect(
			anchors.find((anchor) => anchor.id === "panel-b")?.showContent,
		).toBe(true);
	});

	it("controls toolbar visibility", () => {
		runAppBuilderActionSetContainerVisibility({
			container: {
				name: AppBuilderContainerNameType.Toolbar,
				props: {id: "test-toolbar"},
			},
			mode: "toggle",
			viewportId,
		});

		expect(
			useShapeDiverStoreToolbars.getState().toolbarOpen["test-toolbar"],
		).toBe(false);
	});
});
