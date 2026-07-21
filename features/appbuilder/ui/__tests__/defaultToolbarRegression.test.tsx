/**
 * @jest-environment jsdom
 */
import {useShapeDiverDefaultViewportToolbarStore} from "@AppBuilderLib/entities/viewport/model/useShapeDiverDefaultViewportToolbarStore";
import {useDefaultToolbarRegistration} from "@AppBuilderLib/features/appbuilder/model/useDefaultToolbarRegistration";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {renderHook} from "@testing-library/react";

describe("default toolbar regression", () => {
	beforeEach(() => {
		useShapeDiverStoreToolbars.setState({
			definitionToolbars: [],
			defaultToolbars: [],
			runtimeToolbars: [],
			runtimeTokens: {},
		});
		useShapeDiverDefaultViewportToolbarStore.setState({
			defaultViewportToolbars: {
				vp1: {
					layout: [
						{
							type: "group",
							sections: [[{type: "zoom"}, {type: "historyMenu"}]],
						},
					],
				},
			},
			viewerFullscreen3States: false,
			setViewerFullscreen3States: jest.fn(),
			initialize: jest.fn(),
			add: jest.fn(),
			remove: jest.fn(),
			clear: jest.fn(),
		});
	});

	it("does not register default toolbar when showDefaultToolbar is false", () => {
		renderHook(() =>
			useDefaultToolbarRegistration({
				viewportId: "vp1",
				showDefaultToolbar: false,
			}),
		);
		expect(useShapeDiverStoreToolbars.getState().defaultToolbars).toEqual(
			[],
		);
	});

	it("maps viewport icon buttons to semantic actions and non-action menu triggers", () => {
		renderHook(() =>
			useDefaultToolbarRegistration({
				viewportId: "vp1",
				showDefaultToolbar: true,
			}),
		);
		const items =
			useShapeDiverStoreToolbars.getState().defaultToolbars[0]
				?.groups[0] ?? [];
		expect(items.map((item) => item.type)).toEqual(["action", "menu"]);
		expect(items[0]).toMatchObject({
			type: "action",
			props: {
				definition: {
					type: "camera",
					props: {type: "zoomTo", props: {}},
				},
			},
		});
		expect(items[1]).toMatchObject({
			type: "menu",
			label: "More options",
			props: {items: expect.any(Array)},
		});
	});
});
