import {useShapeDiverViewportIconsStore} from "@AppBuilderShared/store/useShapeDiverViewportIconsStore";
import {Logger} from "@AppBuilderShared/utils/logger";
import {useCallback, useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";

interface CrossBrowserDocument extends Document {
	webkitFullscreenElement?: Element;
	webkitExitFullscreen?: () => void;

	mozRequestFullScreen?: Element;
	mozExitFullScreen?: () => void;

	msRequestFullscreen?: Element;
	msExitFullScreen?: () => void;
}

const eventsFullScreen = [
	"fullscreenchange",
	"webkitfullscreenchange", // Safari
	"mozfullscreenchange", // Mozilla
	"MSFullscreenChange", // IE11
];

/**
 * Fullscreen state enum:
 * - default: not in fullscreen
 * - app: app area (viewer-fullscreen-area) is fullscreen
 * - viewer: app is fullscreen AND UI elements are hidden (only viewer visible)
 */
export enum Fullscreen3StatesState {
	DEFAULT = "default",
	APP = "app",
	VIEWER = "viewer",
}

/**
 * Request fullscreen on an element with cross-browser support.
 * Returns true if request was successful, false otherwise.
 */
const requestFullscreenOnElement = (element: Element): boolean => {
	if (element.requestFullscreen) {
		element.requestFullscreen().catch(() => {});
		return true;
	} else if ((element as any).webkitRequestFullScreen) {
		// Safari
		(element as any).webkitRequestFullScreen().catch(() => {});
		return true;
	} else if ((element as any).mozRequestFullScreen) {
		// Firefox
		(element as any).mozRequestFullScreen().catch(() => {});
		return true;
	} else if ((element as any).msRequestFullscreen) {
		// IE
		(element as any).msRequestFullscreen().catch(() => {});
		return true;
	}
	return false;
};

/**
 * Exit fullscreen with cross-browser support.
 */
const exitFullscreen = (doc: CrossBrowserDocument): void => {
	if (doc.fullscreenElement) {
		doc.exitFullscreen();
	} else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
		doc.webkitExitFullscreen();
	} else if (doc.mozRequestFullScreen && doc.mozExitFullScreen) {
		doc.mozExitFullScreen();
	} else if (doc.msRequestFullscreen && doc.msExitFullScreen) {
		doc.msExitFullScreen();
	}
};

/**
 * Get the current fullscreen element with cross-browser support.
 */
const getFullscreenElement = (doc: CrossBrowserDocument): Element | null => {
	return (
		doc.fullscreenElement ||
		doc.webkitFullscreenElement ||
		(doc.mozRequestFullScreen as unknown as Element) ||
		(doc.msRequestFullscreen as unknown as Element) ||
		null
	);
};

const getAppElement = (
	doc: CrossBrowserDocument,
	fullscreenId: string,
): Element | null => {
	return doc.getElementsByClassName(fullscreenId).item(0);
};

export const useFullscreen = (fullscreenId: string) => {
	const [fullscreenState, setFullscreenState] =
		useState<Fullscreen3StatesState>(Fullscreen3StatesState.DEFAULT);
	const isFullScreenAvailable = useRef(true);
	const cbDocument = useRef<CrossBrowserDocument>(
		typeof document !== "undefined"
			? (document as CrossBrowserDocument)
			: ({} as CrossBrowserDocument),
	);
	const appElementRef = useRef<Element | null>(null);

	// Get viewerFullscreen state and setter from store
	const {viewerFullscreen3States, setViewerFullscreen3States} =
		useShapeDiverViewportIconsStore(
			useShallow((state) => ({
				viewerFullscreen3States: state.viewerFullscreen3States,
				setViewerFullscreen3States: state.setViewerFullscreen3States,
			})),
		);

	// Sync internal state with browser fullscreen + store flag
	const updateFullscreenState = useCallback(() => {
		const fullscreenElement = getFullscreenElement(cbDocument.current);
		if (!fullscreenElement) {
			setFullscreenState(Fullscreen3StatesState.DEFAULT);
		} else if (viewerFullscreen3States) {
			setFullscreenState(Fullscreen3StatesState.VIEWER);
		} else {
			setFullscreenState(Fullscreen3StatesState.APP);
		}
	}, [viewerFullscreen3States]);

	useEffect(() => {
		cbDocument.current = document;
		const appElement = getAppElement(cbDocument.current, fullscreenId);

		if (!appElement) {
			Logger.debug(
				`Fullscreen element with ID ${fullscreenId} not found.`,
			);
			isFullScreenAvailable.current = false;
			return;
		}

		appElementRef.current = appElement;

		// Listen for fullscreen changes to keep state in sync
		eventsFullScreen.forEach((event) => {
			document.addEventListener(event, updateFullscreenState);
		});

		// Initial sync
		updateFullscreenState();

		return () => {
			eventsFullScreen.forEach((event) => {
				document.removeEventListener(event, updateFullscreenState);
			});
		};
	}, [fullscreenId, updateFullscreenState]);

	// Also resync when viewerFullscreen flag changes
	useEffect(() => {
		updateFullscreenState();
	}, [viewerFullscreen3States, updateFullscreenState]);

	// State 1 → State 2: Enter app fullscreen
	const enterAppFullscreen = useCallback(() => {
		// Ensure UI elements are visible when entering app fullscreen
		setViewerFullscreen3States(false);

		// Try to get element from ref, or find it directly
		let appElement = appElementRef.current;
		if (!appElement) {
			appElement = getAppElement(cbDocument.current, fullscreenId);
			if (appElement) {
				appElementRef.current = appElement;
			}
		}

		if (!appElement) {
			Logger.debug(
				`Fullscreen element with ID ${fullscreenId} not found.`,
			);
			isFullScreenAvailable.current = false;
			return;
		}

		if (!requestFullscreenOnElement(appElement)) {
			isFullScreenAvailable.current = false;
		}
	}, [fullscreenId, setViewerFullscreen3States]);

	// State 2 → State 3: Enter viewer fullscreen (hide UI elements)
	const enterViewerFullscreen = useCallback(() => {
		// Instead of requesting fullscreen on canvas, just hide UI elements
		setViewerFullscreen3States(true);
	}, [setViewerFullscreen3States]);

	// State 3 → State 1: Exit fullscreen completely
	const exitFullscreenCompletely = useCallback(() => {
		// First, show UI elements
		setViewerFullscreen3States(false);
		// Then exit browser fullscreen
		exitFullscreen(cbDocument.current);
	}, [setViewerFullscreen3States]);

	// Main click handler - transitions based on current state
	const handleFullscreenClick = useCallback(() => {
		switch (fullscreenState) {
			case Fullscreen3StatesState.DEFAULT:
				enterAppFullscreen();
				break;
			case Fullscreen3StatesState.APP:
				enterViewerFullscreen();
				break;
			case Fullscreen3StatesState.VIEWER:
				exitFullscreenCompletely();
				break;
		}
	}, [
		fullscreenState,
		enterAppFullscreen,
		enterViewerFullscreen,
		exitFullscreenCompletely,
	]);

	return {
		fullscreenState,
		handleFullscreenClick,
		enterAppFullscreen,
		enterViewerFullscreen,
		exitFullscreenCompletely,
		isFullScreenAvailable,
	};
};
