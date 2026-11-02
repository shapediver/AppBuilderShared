import {useCallback, useLayoutEffect, useRef} from "react";

/** How long the restored offset is held while the content (images) settles. */
const RESTORE_TIMEOUT_MS = 3000;

const USER_SCROLL_EVENTS = ["wheel", "touchstart", "pointerdown", "keydown"];

/**
 * Wraps a list's scroll-root ref so its scroll offset survives an unmount or
 * an idle phase (Activity tears down layout effects and runs them again).
 * Tracks the offset while visible, saves it when the list hides, and scrolls
 * back on mount. Holds that offset while images grow the content, until the
 * user scrolls or the content has had time to settle.
 *
 * Only applies when the list has its own scroll container (`height` set).
 */
export function useRestoredScrollTop(
	scrollRootRef: ((node: HTMLDivElement | null) => void) | undefined,
	initialScrollTop: number,
	save: (scrollTop: number) => void,
) {
	const elementRef = useRef<HTMLDivElement | null>(null);
	const scrollTopRef = useRef(initialScrollTop);

	const ref = useCallback(
		(node: HTMLDivElement | null) => {
			elementRef.current = node;
			scrollRootRef?.(node);
		},
		[scrollRootRef],
	);

	useLayoutEffect(() => {
		const el = elementRef.current;
		if (!el) {
			return;
		}

		let restoring = false;
		let observer: ResizeObserver | undefined;
		let timeout: ReturnType<typeof setTimeout> | undefined;

		const stopRestoring = () => {
			restoring = false;
			observer?.disconnect();
			observer = undefined;
			clearTimeout(timeout);
		};

		const onScroll = () => {
			// A hidden list reports 0. Keep the last visible offset.
			if (restoring || el.clientHeight === 0) {
				return;
			}
			scrollTopRef.current = el.scrollTop;
		};

		el.addEventListener("scroll", onScroll, {passive: true});
		USER_SCROLL_EVENTS.forEach((type) =>
			el.addEventListener(type, stopRestoring, {passive: true}),
		);

		const target = scrollTopRef.current;
		// Keep applying the offset while the content settles. Reaching it once
		// is not enough: images that load later grow the cards above, and
		// scroll anchoring would then move the list away from it.
		const restore = () => {
			el.scrollTop = target;
		};

		if (target > 0) {
			restoring = true;
			restore();
			if (typeof ResizeObserver !== "undefined") {
				observer = new ResizeObserver(restore);
				Array.from(el.children).forEach((child) =>
					observer?.observe(child),
				);
			}
			timeout = setTimeout(stopRestoring, RESTORE_TIMEOUT_MS);
		}

		return () => {
			stopRestoring();
			el.removeEventListener("scroll", onScroll);
			USER_SCROLL_EVENTS.forEach((type) =>
				el.removeEventListener(type, stopRestoring),
			);
			save(scrollTopRef.current);
		};
	}, [save]);

	return ref;
}
