import {useShapeDiverStoreViewportAccessFunctions} from "../model/useShapeDiverStoreViewportAccessFunctions";

export const DEFAULT_VIEWPORT_ID = "viewport_1";

/**
 * Resolve a viewport id from registered access functions (both ShapeDiver and
 * host viewports). Must not import `useShapeDiverStoreViewport` —
 * ecommerce/agent paths load this from every host.
 */
export function resolveViewportIdFromStore(viewportId?: string): string {
	if (viewportId) {
		return viewportId;
	}
	const access =
		useShapeDiverStoreViewportAccessFunctions.getState()
			.viewportAccessFunctions;
	if (access[DEFAULT_VIEWPORT_ID]) {
		return DEFAULT_VIEWPORT_ID;
	}
	return Object.keys(access)[0] ?? DEFAULT_VIEWPORT_ID;
}
