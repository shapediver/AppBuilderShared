import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "@AppBuilderShared/store/storeSettings";
import { IShapeDiverStoreViewportAccessFunctionsStore } from "@AppBuilderShared/types/store/shapediverStoreViewportAccessFunctions";


/**
 * Store for ShapeDiver viewport access functions.
 * @see {@link IShapeDiverStoreViewportAccessFunctions}
 */
export const useShapeDiverStoreViewportAccessFunctions = create<IShapeDiverStoreViewportAccessFunctionsStore>()(devtools((set, get) => ({

	viewportAccessFunctions: {},

	addViewportAccessFunctions: (viewportId, accessFunctions) => {
		set(state => ({
			viewportAccessFunctions: {
				...state.viewportAccessFunctions,
				[viewportId]: accessFunctions
			}
		}), false, `addViewportAccessFunctions ${viewportId}`);
	},

	removeViewportAccessFunctions: (viewportId) => {
		const { viewportAccessFunctions } = get();

		if (!viewportAccessFunctions[viewportId]) return;

		set(state => {
			const newState = { ...state.viewportAccessFunctions };
			delete newState[viewportId];

			return { viewportAccessFunctions: newState };
		}, false, `removeViewportAccessFunctions ${viewportId}`);
	}

}), { ...devtoolsSettings, name: "ShapeDiver | Viewer" }));
