import {create} from "zustand";

interface DrawingOptionsStore {
	// state for the point labels
	showPointLabels: boolean;
	setShowPointLabels: (show: boolean) => void;
	// state for the distance labels
	showDistanceLabels: boolean;
	setShowDistanceLabels: (show: boolean) => void;
}

/**
 * Store for the drawing options.
 *
 * We use Zustand to create a store for the drawing options.
 * This is needed as the options should be saved for multiple usages.
 * Otherwise, the options would be reset every time the component is re-rendered.
 */
export const useDrawingOptionsStore = create<DrawingOptionsStore>((set) => ({
	showPointLabels: false,
	setShowPointLabels: (show: boolean) => set({showPointLabels: show}),
	showDistanceLabels: true,
	setShowDistanceLabels: (show: boolean) => set({showDistanceLabels: show}),
}));
