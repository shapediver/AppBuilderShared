import {AppBuilderStackContext} from "@AppBuilderLib/features/appbuilder/lib/StackContext";
import {Box} from "@mantine/core";
import React, {
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import AppBuilderContainer from "~/shared/pages/templates/AppBuilderContainer";
import {stackFallbackScrollStyle} from "@AppBuilderLib/features/appbuilder/lib/stackLayout";

interface Props {
	isOpen: boolean;
	children: React.ReactNode;
	fallbackContent: React.ReactNode;
	/** When true, fallback layer scrolls inside a constrained parent (nested stack body slot). */
	fallbackScrolls?: boolean;
}

const layerStyleBase = {
	gridArea: "1 / 1",
	overflow: "hidden",
} as const;

const layerStyleFill = {
	...layerStyleBase,
	minHeight: 0,
	maxHeight: "100%",
	height: "100%",
} as const;

/**
 * Grid overlay wrapper: layers stay in document flow (fixes floating-container height collapse).
 * `overflow: hidden` on both axes — `overflowX: hidden` alone computes to `overflow-y: auto`
 * and flashes a scrollbar when a child button is pressed (`:active` translateY).
 */
const wrapperStyleBase = {
	display: "grid",
	gridTemplateColumns: "1fr",
	width: "100%",
	overflow: "hidden",
} as const;

const wrapperStyleFill = {
	...wrapperStyleBase,
	height: "100%",
	minHeight: 0,
	maxHeight: "100%",
	alignSelf: "stretch",
} as const;

/**
 * Slide transition between fallback content (widget list) and stack content.
 * Forward open: right to left. Back navigation: left to right (`isTransitioning` from context).
 */
export function AppBuilderStackUiWidgetAnimationWrapper({
	isOpen,
	children,
	fallbackContent,
	fallbackScrolls = false,
}: Props) {
	const {isTransitioning, animationDuration} = useContext(
		AppBuilderStackContext,
	);
	const [showStack, setShowStack] = useState(isOpen);
	const [showFallback, setShowFallback] = useState(!isOpen);
	const [stackPosition, setStackPosition] = useState(isOpen ? "0" : "100%");
	const [fallbackPosition, setFallbackPosition] = useState(
		isOpen ? "-100%" : "0",
	);
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
	const rafStartRef = useRef<number | null>(null);
	const rafEndRef = useRef<number | null>(null);
	/** Tracks open/close edges so live widget updates do not restart the forward animation. */
	const wasOpenRef = useRef(isOpen);

	const resetAnimation = useCallback(() => {
		clearTimeout(timeoutRef.current);
		if (rafStartRef.current !== null) {
			cancelAnimationFrame(rafStartRef.current);
			rafStartRef.current = null;
		}
		if (rafEndRef.current !== null) {
			cancelAnimationFrame(rafEndRef.current);
			rafEndRef.current = null;
		}
	}, []);

	/**
	 * Two nested `requestAnimationFrame` calls: paint the start transform first,
	 * then update to the end value on the following frame so the CSS transition runs.
	 */
	const scheduleSlide = useCallback((onNextFrame: () => void) => {
		rafStartRef.current = requestAnimationFrame(() => {
			rafEndRef.current = requestAnimationFrame(onNextFrame);
		});
	}, []);

	/** Closed layout when `isOpen` becomes false without a back-transition (e.g. lookup failure). */
	const resetClosedLayers = useCallback(() => {
		setShowFallback(true);
		setShowStack(false);
		setStackPosition("100%");
		setFallbackPosition("0");
	}, []);

	// State machine: closed ↔ opening ↔ open ↔ closing.
	// Forward (push):  isOpen false→true, isTransitioning=false → forward slide
	// Backward (pop):  isTransitioning becomes true while isOpen still true → back slide;
	//                  path clears after animationDuration, setting isOpen false
	// Live update:     isOpen true, wasOpen already true, isTransitioning false → no-op
	useEffect(() => {
		resetAnimation();

		if (!isOpen) {
			wasOpenRef.current = false;
			if (!isTransitioning) {
				resetClosedLayers();
			}
			return;
		}

		const opening = !wasOpenRef.current;
		wasOpenRef.current = true;

		if (!opening && !isTransitioning) {
			return;
		}

		if (isTransitioning) {
			setShowFallback(true);
			setShowStack(true);
			setStackPosition("0");
			setFallbackPosition("-100%");
			scheduleSlide(() => {
				setFallbackPosition("0");
				setStackPosition("100%");
			});
			timeoutRef.current = setTimeout(() => {
				setShowStack(false);
			}, animationDuration);
		} else {
			setShowStack(true);
			setShowFallback(true);
			setStackPosition("100%");
			setFallbackPosition("0");
			scheduleSlide(() => {
				setFallbackPosition("-100%");
				setStackPosition("0");
			});
			timeoutRef.current = setTimeout(() => {
				setShowFallback(false);
			}, animationDuration);
		}

		return resetAnimation;
	}, [
		isOpen,
		isTransitioning,
		animationDuration,
		resetAnimation,
		resetClosedLayers,
		scheduleSlide,
	]);

	const transition = `transform ${animationDuration}ms ease`;
	/** Closed/top-level: content-sized so the parent Group can center sibling widgets vertically.
	 *  Fill mode is only needed when open (stack overlays parent) or in a constrained body slot. */
	const fillParent = isOpen || fallbackScrolls;
	const wrapperStyle = fillParent ? wrapperStyleFill : wrapperStyleBase;
	const layerStyle = fillParent ? layerStyleFill : layerStyleBase;

	return (
		<Box component="section" style={wrapperStyle}>
			{showFallback && (
				<AppBuilderContainer
					p={0}
					style={{
						...layerStyle,
						transform: `translateX(${fallbackPosition})`,
						transition,
					}}
				>
					{fallbackScrolls ? (
						<Box style={stackFallbackScrollStyle}>
							{fallbackContent}
						</Box>
					) : (
						fallbackContent
					)}
				</AppBuilderContainer>
			)}
			{showStack && (
				<Box
					style={{
						...layerStyle,
						transform: `translateX(${stackPosition})`,
						transition,
						zIndex: 5,
					}}
				>
					{children}
				</Box>
			)}
		</Box>
	);
}
