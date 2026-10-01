/** @jest-environment jsdom */
import {useShapeDiverStoreViewportAnchors} from "@AppBuilderLib/entities/viewport-anchor/model/useShapeDiverStoreViewportAnchors";
import {AppBuilderContainerNameType} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {closeSiblingToolbarContainers} from "../closeSiblingToolbarContainers";

describe("closeSiblingToolbarContainers", () => {
	const viewportId = "test-viewport";

	beforeEach(() => {
		useShapeDiverStoreViewportAnchors.setState({
			anchors: {
				[viewportId]: [
					{
						type: AppBuilderContainerNameType.Anchor2d,
						id: "panel-2d",
						showContent: true,
						hideable: true,
						exclusive: false,
					},
					{
						type: AppBuilderContainerNameType.Anchor3d,
						id: "panel-3d",
						showContent: true,
						hideable: true,
						exclusive: false,
						zIndex: 0,
					},
					{
						type: AppBuilderContainerNameType.Anchor2d,
						id: "unrelated",
						showContent: true,
						hideable: true,
						exclusive: false,
					},
				],
			},
			showContentMap: {},
			dragOffsetMap: {},
		});
	});

	it("closes other 2d and 3d siblings and leaves the opened id open", () => {
		closeSiblingToolbarContainers(viewportId, "panel-3d", [
			"panel-2d",
			"panel-3d",
		]);

		const anchors =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		expect(anchors.find((a) => a.id === "panel-3d")?.showContent).toBe(
			true,
		);
		expect(anchors.find((a) => a.id === "panel-2d")?.showContent).toBe(
			false,
		);
		expect(anchors.find((a) => a.id === "unrelated")?.showContent).toBe(
			true,
		);
	});

	it("does nothing when there are no siblings", () => {
		closeSiblingToolbarContainers(viewportId, "panel-2d", []);

		const anchors =
			useShapeDiverStoreViewportAnchors.getState().anchors[viewportId];
		expect(anchors.every((a) => a.showContent)).toBe(true);
	});
});
