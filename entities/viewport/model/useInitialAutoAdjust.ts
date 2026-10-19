import {useEffect, useRef} from "react";
import {useShallow} from "zustand/react/shallow";
import {useShapeDiverStoreViewportAccessFunctions} from "./useShapeDiverStoreViewportAccessFunctions";

/**
 * Hook which adjusts the cameras of all viewports once the sessions
 * defined in the settings have been loaded.
 *
 * The camera of a viewport is fitted to the scene only when the viewport
 * is created. In case the controller session contains no geometry and
 * the geometry comes from secondary sessions, the initial fit sees an
 * empty scene. This hook triggers a one-time zoomTo once `loaded` becomes
 * true for every viewport which has `initialAutoAdjust` set, regardless of
 * the autoAdjust setting of its camera. Viewports without `initialAutoAdjust`
 * are left untouched, so the initial camera of existing apps is not changed.
 *
 * This is the counterpart of the behavior for instanced sessions, see
 * `adjustCamerasToInstances` in `useAppBuilderInstances`.
 *
 * @param props
 */
export function useInitialAutoAdjust(props: {
	/** Whether all sessions whose geometry shall be fitted have been loaded. */
	loaded: boolean;
}) {
	const {loaded} = props;

	const viewportAccessFunctions = useShapeDiverStoreViewportAccessFunctions(
		useShallow((state) => state.viewportAccessFunctions),
	);

	// ids of viewports which have already been adjusted
	const adjustedViewportsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (!loaded) return;

		for (const [viewportId, accessFunctions] of Object.entries(
			viewportAccessFunctions,
		)) {
			if (adjustedViewportsRef.current.has(viewportId)) continue;
			if (!accessFunctions.zoomTo) continue;
			if (!accessFunctions.dto?.initialAutoAdjust) continue;
			adjustedViewportsRef.current.add(viewportId);

			// wait for the next render loop to ensure that the
			// geometry of the sessions is part of the scene
			setTimeout(() => {
				accessFunctions.zoomTo?.(false, {duration: 0});
			}, 0);
		}
	}, [loaded, viewportAccessFunctions]);
}
