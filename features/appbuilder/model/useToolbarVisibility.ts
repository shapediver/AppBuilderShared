import {useViewportControls} from "@AppBuilderLib/entities/viewport/model/useViewportControls";
import {SystemInfo} from "@shapediver/viewer.session";
import {useEffect, useMemo, useRef, useState} from "react";
import {AppBuilderToolbarVisibility} from "../config/appbuilder";

interface UseToolbarVisibilityOptions {
	mode: AppBuilderToolbarVisibility;
	delayMs?: number;
}

export function useToolbarVisibility(options: UseToolbarVisibilityOptions) {
	const {mode, delayMs = 500} = options;
	const {showControls, setIsHoveringControls} = useViewportControls();
	const [isFocusedWithin, setIsFocusedWithin] = useState(false);
	const [isMenuOpen, setMenuOpen] = useState(false);
	const pointerFocusRef = useRef(false);
	const [reducedMotion, setReducedMotion] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mediaQuery = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		);
		const update = () => setReducedMotion(mediaQuery.matches);
		update();
		mediaQuery.addEventListener?.("change", update);
		return () => mediaQuery.removeEventListener?.("change", update);
	}, []);

	const visible = useMemo(() => {
		if (mode === "always") return true;
		if (SystemInfo.instance.isMobile) return true;
		return showControls || isFocusedWithin || isMenuOpen;
	}, [isFocusedWithin, isMenuOpen, mode, showControls]);

	return {
		visible,
		delayMs,
		isMenuOpen,
		setMenuOpen,
		reducedMotion,
		containerProps: {
			onMouseEnter: () => setIsHoveringControls(true),
			onMouseLeave: () => setIsHoveringControls(false),
			onPointerDown: () => {
				pointerFocusRef.current = true;
				setIsFocusedWithin(false);
			},
			onKeyDown: () => {
				pointerFocusRef.current = false;
			},
			onFocus: () => {
				setIsFocusedWithin(!pointerFocusRef.current);
				setIsHoveringControls(true);
			},
			onBlur: () => {
				pointerFocusRef.current = false;
				setIsFocusedWithin(false);
				setIsHoveringControls(false);
			},
		},
	};
}
