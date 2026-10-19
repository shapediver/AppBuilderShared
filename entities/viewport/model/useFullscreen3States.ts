import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useCallback, useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {useShapeDiverDefaultViewportToolbarStore} from "./useShapeDiverDefaultViewportToolbarStore";

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

const getDocument = (): CrossBrowserDocument =>
	typeof document !== "undefined"
		? (document as CrossBrowserDocument)
		: ({} as CrossBrowserDocument);

export function getFullscreen3StatesState(
	doc: CrossBrowserDocument = getDocument(),
): Fullscreen3StatesState {
	const fullscreenElement = getFullscreenElement(doc);
	if (!fullscreenElement) {
		return Fullscreen3StatesState.DEFAULT;
	}
	if (
		useShapeDiverDefaultViewportToolbarStore.getState()
			.viewerFullscreen3States
	) {
		return Fullscreen3StatesState.VIEWER;
	}
	return Fullscreen3StatesState.APP;
}

function enterAppFullscreen(fullscreenId: string, doc: CrossBrowserDocument) {
	useShapeDiverDefaultViewportToolbarStore
		.getState()
		.setViewerFullscreen3States(false);
	const appElement = getAppElement(doc, fullscreenId);
	if (!appElement) {
		Logger.debug(`Fullscreen element with ID ${fullscreenId} not found.`);
		return;
	}
	requestFullscreenOnElement(appElement);
}

/**
 * Advance DEFAULT → APP → VIEWER → DEFAULT. Used by the toolbar button and
 * the host-registered fullscreen `run` (not the shared action catalog).
 */
export function cycleFullscreen3States(fullscreenId: string): void {
	const doc = getDocument();
	switch (getFullscreen3StatesState(doc)) {
		case Fullscreen3StatesState.DEFAULT:
			enterAppFullscreen(fullscreenId, doc);
			break;
		case Fullscreen3StatesState.APP:
			useShapeDiverDefaultViewportToolbarStore
				.getState()
				.setViewerFullscreen3States(true);
			break;
		case Fullscreen3StatesState.VIEWER:
			useShapeDiverDefaultViewportToolbarStore
				.getState()
				.setViewerFullscreen3States(false);
			exitFullscreen(doc);
			break;
	}
}

export const useFullscreen = (fullscreenId: string) => {
	const [fullscreenState, setFullscreenState] =
		useState<Fullscreen3StatesState>(Fullscreen3StatesState.DEFAULT);
	const isFullScreenAvailable = useRef(true);
	const cbDocument = useRef<CrossBrowserDocument>(getDocument());
	const appElementRef = useRef<Element | null>(null);

	const {viewerFullscreen3States, setViewerFullscreen3States} =
		useShapeDiverDefaultViewportToolbarStore(
			useShallow((state) => ({
				viewerFullscreen3States: state.viewerFullscreen3States,
				setViewerFullscreen3States: state.setViewerFullscreen3States,
			})),
		);

	const updateFullscreenState = useCallback(() => {
		setFullscreenState(getFullscreen3StatesState());
	}, [fullscreenId]);

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

		eventsFullScreen.forEach((event) => {
			document.addEventListener(event, updateFullscreenState);
		});

		updateFullscreenState();

		return () => {
			eventsFullScreen.forEach((event) => {
				document.removeEventListener(event, updateFullscreenState);
			});
		};
	}, [fullscreenId, updateFullscreenState]);

	useEffect(() => {
		updateFullscreenState();
	}, [viewerFullscreen3States, updateFullscreenState]);

	const enterAppFullscreenCallback = useCallback(() => {
		enterAppFullscreen(fullscreenId, cbDocument.current);
	}, [fullscreenId]);

	const enterViewerFullscreen = useCallback(() => {
		setViewerFullscreen3States(true);
	}, [setViewerFullscreen3States]);

	const exitFullscreenCompletely = useCallback(() => {
		setViewerFullscreen3States(false);
		exitFullscreen(cbDocument.current);
	}, [setViewerFullscreen3States]);

	const handleFullscreenClick = useCallback(() => {
		cycleFullscreen3States(fullscreenId);
	}, [fullscreenId]);

	return {
		fullscreenState,
		handleFullscreenClick,
		enterAppFullscreen: enterAppFullscreenCallback,
		enterViewerFullscreen,
		exitFullscreenCompletely,
		isFullScreenAvailable,
	};
};
