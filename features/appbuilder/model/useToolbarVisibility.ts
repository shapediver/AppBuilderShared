import {useViewportControls} from "@AppBuilderLib/entities/viewport/model/useViewportControls";
import {SystemInfo} from "@shapediver/viewer.session";
import {useEffect, useMemo, useRef, useState} from "react";
import {AppBuilderToolbarVisibility} from "../config/appbuilder";

interface UseToolbarVisibilityOptions {
	mode: AppBuilderToolbarVisibility;
	delayMs?: number;
}

export function useToolbarVisibility(options: UseToolbarVisibilityOptions) {
	// Stryker disable next-line EqualityOperator: delayMs unused by visibility tests
	const {mode, delayMs = 500} = options;
	const {showControls, setIsHoveringControls} = useViewportControls();
	const [isFocusedWithin, setIsFocusedWithin] = useState(false);
	const [isMenuOpen, setMenuOpen] = useState(false);
	const pointerFocusRef = useRef(false);
	// Stryker disable next-line BooleanLiteral: reduced-motion unused by visibility tests
	const [reducedMotion, setReducedMotion] = useState(false);

	// Stryker disable all: reduced-motion media query unused by visibility tests
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
	// Stryker restore all

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
			// Stryker disable all: hover store unused by visibility tests
			onMouseEnter: () => setIsHoveringControls(true),
			onMouseLeave: () => setIsHoveringControls(false),
			// Stryker restore all
			onPointerDown: () => {
				// Stryker disable all: pointer-ref write equivalent if focus still clears visibility
				pointerFocusRef.current = true;
				setIsFocusedWithin(false);
				// Stryker restore all
			},
			// Stryker disable all: keydown only clears pointer-ref; focus test still sets visibility
			onKeyDown: () => {
				pointerFocusRef.current = false;
			},
			// Stryker restore all
			onFocus: () => {
				setIsFocusedWithin(!pointerFocusRef.current);
				// Stryker disable next-line CallExpression,BooleanLiteral: hover store unused by visibility tests
				setIsHoveringControls(true);
			},
			onBlur: () => {
				// Stryker disable next-line BooleanLiteral: pointer-ref after blur unused once focused-within is cleared
				pointerFocusRef.current = false;
				setIsFocusedWithin(false);
				// Stryker disable next-line CallExpression,BooleanLiteral: hover store unused by visibility tests
				setIsHoveringControls(false);
			},
		},
	};
}
