import {useShapeDiverStoreViewport} from "../model/useShapeDiverStoreViewport";

export const DEFAULT_VIEWPORT_ID = "viewport_1";

export function resolveViewportIdFromStore(viewportId?: string): string {
	if (viewportId) {
		return viewportId;
	}
	const viewports = useShapeDiverStoreViewport.getState().viewports;
	if (viewports[DEFAULT_VIEWPORT_ID]) {
		return DEFAULT_VIEWPORT_ID;
	}
	return Object.keys(viewports)[0] ?? DEFAULT_VIEWPORT_ID;
}
