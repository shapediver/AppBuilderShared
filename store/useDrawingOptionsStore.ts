import {create} from "zustand";

interface DrawingOptionsStore {
	// state for the currently active parameter
	activeParameter?: string;
	setActiveParameter: (parameter?: string) => void;
	// state for the point labels
	showPointLabels: boolean;
	setShowPointLabels: (show: boolean) => void;
	// state for the distance labels
	showDistanceLabels: boolean;
	setShowDistanceLabels: (show: boolean) => void;
	// state for the snap to vertices
	snapToVertices: boolean;
	setSnapToVertices: (snap: boolean) => void;
	// state for the snap to edges
	snapToEdges: boolean;
	setSnapToEdges: (snap: boolean) => void;
	// state for the snap to faces
	snapToFaces: boolean;
	setSnapToFaces: (snap: boolean) => void;
}

/**
 * Store for the drawing options.
 *
 * We use Zustand to create a store for the drawing options.
 * This is needed as the options should be saved for multiple usages.
 * Otherwise, the options would be reset every time the component is re-rendered.
 */
export const useDrawingOptionsStore = create<DrawingOptionsStore>((set) => ({
	activeParameter: undefined,
	setActiveParameter: (parameter?: string) =>
		set({activeParameter: parameter}),
	showPointLabels: false,
	setShowPointLabels: (show: boolean) => set({showPointLabels: show}),
	showDistanceLabels: true,
	setShowDistanceLabels: (show: boolean) => set({showDistanceLabels: show}),
	snapToVertices: true,
	setSnapToVertices: (snap: boolean) => set({snapToVertices: snap}),
	snapToEdges: true,
	setSnapToEdges: (snap: boolean) => set({snapToEdges: snap}),
	snapToFaces: true,
	setSnapToFaces: (snap: boolean) => set({snapToFaces: snap}),
}));
