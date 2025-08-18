import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {ViewportCreateDto} from "@AppBuilderShared/types/shapediver/viewport";
import {IShapeDiverStoreViewport} from "@AppBuilderShared/types/store/shapediverStoreViewport";
import {ViewportIconButtonType} from "@AppBuilderShared/types/store/shapediverStoreViewportIcons";
import {createViewport, IViewportApi} from "@shapediver/viewer.viewport";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {useShapeDiverViewportIconsStore} from "./useShapeDiverViewportIconsStore";

/**
 * Helper for comparing viewports.
 */
const createViewportIdentifier = function (
	parameters: Pick<ViewportCreateDto, "id">,
) {
	return JSON.stringify({
		id: parameters.id,
	});
};

/**
 * Store data related to the ShapeDiver 3D Viewer Viewport.
 * @see {@link IShapeDiverStoreViewport}
 */
export const useShapeDiverStoreViewport = create<IShapeDiverStoreViewport>()(
	devtools(
		(set, get) => ({
			viewports: {},

			createViewport: async (dto: ViewportCreateDto, callbacks) => {
				// in case a viewport with the same identifier exists, skip creating a new one
				const identifier = createViewportIdentifier(dto);
				const {viewports} = get();

				if (
					Object.values(viewports).findIndex(
						(v) => identifier === createViewportIdentifier(v),
					) >= 0
				)
					return;

				let viewport: IViewportApi | undefined = undefined;

				try {
					viewport = await createViewport(dto);

					// Add viewport icons using external store access
					const iconStore =
						useShapeDiverViewportIconsStore.getState();
					iconStore.add(viewport.id, [
						...(viewport.enableAR
							? [{type: ViewportIconButtonType.Ar}]
							: []),
						{type: ViewportIconButtonType.Zoom},
						{type: ViewportIconButtonType.Fullscreen},
						{type: ViewportIconButtonType.Cameras},
					]);
					iconStore.add(viewport.id, [
						{type: ViewportIconButtonType.Undo},
						{type: ViewportIconButtonType.Redo},
						{type: ViewportIconButtonType.HistoryMenu},
					]);
				} catch (e: any) {
					callbacks?.onError(e);
				}

				set(
					(state) => {
						return {
							viewports: {
								...state.viewports,
								...(viewport ? {[viewport.id]: viewport} : {}),
							},
						};
					},
					false,
					"createViewport",
				);

				return viewport;
			},

			closeViewport: async (viewportId, callbacks) => {
				const {viewports} = get();
				const viewport = viewports[viewportId];
				if (!viewport) return;

				try {
					await viewport.close();
				} catch (e) {
					callbacks?.onError(e);

					return;
				}

				return set(
					(state) => {
						// create a new object, omitting the session which was closed
						const newViewports: {[id: string]: IViewportApi} = {};
						Object.keys(state.viewports).forEach((id) => {
							if (id !== viewportId)
								newViewports[id] = state.viewports[id];
						});

						return {
							viewports: newViewports,
						};
					},
					false,
					"closeViewport",
				);
			},
		}),
		{...devtoolsSettings, name: "ShapeDiver | Viewer"},
	),
);
