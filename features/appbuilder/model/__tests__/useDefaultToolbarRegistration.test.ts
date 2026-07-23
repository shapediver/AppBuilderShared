/**
 * @jest-environment jsdom
 */
import {useShapeDiverDefaultViewportToolbarStore} from "@AppBuilderLib/entities/viewport/model/useShapeDiverDefaultViewportToolbarStore";
import type {IViewportApi} from "@shapediver/viewer.viewport";
import {renderHook} from "@testing-library/react";
import {useDefaultToolbarRegistration} from "../useDefaultToolbarRegistration";
import {useShapeDiverStoreToolbars} from "../useShapeDiverStoreToolbars";

describe("useDefaultToolbarRegistration", () => {
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
				vp2: {
					layout: [
						{
							type: "group",
							sections: [[{type: "fullscreen"}]],
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

	it("registers a default toolbar from the current viewport icon layout", () => {
		renderHook(() =>
			useDefaultToolbarRegistration({
				viewportId: "vp1",
				showDefaultToolbar: true,
			}),
		);

		const defaultToolbar =
			useShapeDiverStoreToolbars.getState().defaultToolbars[0];
		expect(defaultToolbar?.id).toBe("defaultViewportToolbar-vp1");
		expect(defaultToolbar?.groups[0]).toHaveLength(2);
		expect(defaultToolbar?.groups[0][0]).toMatchObject({
			type: "action",
			props: {
				definition: {
					type: "camera",
					props: {type: "zoomTo", props: {}},
				},
			},
		});
		expect(defaultToolbar?.groups[0][1]).toMatchObject({
			type: "actionMenu",
			label: "More options",
			props: {sections: expect.any(Array)},
		});
	});

	it("filters historyMenu when hideJsonMenu is true", () => {
		renderHook(() =>
			useDefaultToolbarRegistration({
				viewportId: "vp1",
				hideJsonMenu: true,
				showDefaultToolbar: true,
			}),
		);

		const defaultToolbar =
			useShapeDiverStoreToolbars.getState().defaultToolbars[0];
		expect(defaultToolbar?.groups[0]).toHaveLength(1);
		expect(defaultToolbar?.groups[0][0]).toMatchObject({
			type: "action",
			props: {
				definition: {
					type: "camera",
					props: {type: "zoomTo", props: {}},
				},
			},
		});
	});

	it("generates camera menu actions for unnamed cameras by id", () => {
		useShapeDiverDefaultViewportToolbarStore.setState({
			defaultViewportToolbars: {
				vp1: {
					layout: [
						{
							type: "button",
							button: {type: "cameras"},
						},
					],
				},
			},
		});
		const viewport = {
			id: "vp1",
			cameras: {
				unnamedCamera: {id: "unnamedCamera"},
			},
		} as unknown as IViewportApi;

		renderHook(() =>
			useDefaultToolbarRegistration({
				viewportId: "vp1",
				showDefaultToolbar: true,
				viewport,
			}),
		);

		expect(
			useShapeDiverStoreToolbars.getState().defaultToolbars[0]
				?.groups[0][0],
		).toMatchObject({
			type: "actionMenu",
			label: "Cameras",
			props: {
				sections: [
					[
						{
							label: "UnnamedCamera",
							props: {
								definition: {
									type: "camera",
									props: {
										type: "assign",
										props: {
											camera: {name: "unnamedCamera"},
										},
									},
								},
							},
						},
					],
				],
			},
		});
	});

	it("keeps default toolbar registrations per viewport", () => {
		const first = renderHook(() =>
			useDefaultToolbarRegistration({
				viewportId: "vp1",
				showDefaultToolbar: true,
			}),
		);
		const second = renderHook(() =>
			useDefaultToolbarRegistration({
				viewportId: "vp2",
				showDefaultToolbar: true,
			}),
		);

		expect(
			useShapeDiverStoreToolbars
				.getState()
				.selectMergedToolbars()
				.map((toolbar) => toolbar.id),
		).toEqual(["defaultViewportToolbar-vp1", "defaultViewportToolbar-vp2"]);

		first.unmount();
		expect(
			useShapeDiverStoreToolbars
				.getState()
				.selectMergedToolbars()
				.map((toolbar) => toolbar.id),
		).toEqual(["defaultViewportToolbar-vp2"]);

		second.unmount();
		expect(useShapeDiverStoreToolbars.getState().defaultToolbars).toEqual(
			[],
		);
	});

	it("does not register the default toolbar when showDefaultToolbar is false", () => {
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
});
