import {create} from "zustand";

interface ViewportAnchorTriggerRegistryStore {
	triggers: Record<string, HTMLElement | null>;
	setTrigger: (anchorId: string, element: HTMLElement | null) => void;
}

export const useViewportAnchorTriggerRegistry =
	create<ViewportAnchorTriggerRegistryStore>((set) => ({
		triggers: {},
		setTrigger: (anchorId, element) =>
			set((state) => {
				if (state.triggers[anchorId] === element) return state;
				return {
					triggers: {
						...state.triggers,
						[anchorId]: element,
					},
				};
			}),
	}));
