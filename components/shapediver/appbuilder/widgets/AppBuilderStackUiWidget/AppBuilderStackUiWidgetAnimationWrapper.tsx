import {AppBuilderStackContext} from "@AppBuilderShared/context/StackContext";
import {Box, Stack} from "@mantine/core";
import React, {
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

interface Props {
	isOpen: boolean;
	children: React.ReactNode;
	fallbackContent: React.ReactNode;
}

export function AppBuilderStackUiWidgetAnimationWrapper({
	isOpen,
	children,
	fallbackContent,
}: Props) {
	const stackContext = useContext(AppBuilderStackContext);
	const [showStack, setShowStack] = useState(isOpen);
	const [showFallback, setShowFallback] = useState(!isOpen);
	const [stackPosition, setStackPosition] = useState(isOpen ? "0" : "100%");
	const [fallbackPosition, setFallbackPosition] = useState(
		isOpen ? "-100%" : "0",
	);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const rafStartRef = useRef<number | null>(null);
	const rafEndRef = useRef<number | null>(null);

	const resetAnimation = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		if (rafStartRef.current !== null) {
			cancelAnimationFrame(rafStartRef.current);
			rafStartRef.current = null;
		}
		if (rafEndRef.current !== null) {
			cancelAnimationFrame(rafEndRef.current);
			rafEndRef.current = null;
		}
	}, []);

	useEffect(() => {
		resetAnimation();

		if (isOpen) {
			if (stackContext.isTransitioning) {
				// Backward (clicking "back"): left to right
				setShowFallback(true);
				setStackPosition("0");
				setFallbackPosition("-100%");
				rafStartRef.current = requestAnimationFrame(() => {
					rafEndRef.current = requestAnimationFrame(() => {
						setFallbackPosition("0");
						setStackPosition("100%");
					});
				});
				timeoutRef.current = setTimeout(() => {
					setShowStack(false);
				}, stackContext.animationDuration);
			} else {
				// Forward (clicking button): right to left
				setShowStack(true);
				setShowFallback(true);
				setStackPosition("100%");
				setFallbackPosition("0");
				rafStartRef.current = requestAnimationFrame(() => {
					rafEndRef.current = requestAnimationFrame(() => {
						setFallbackPosition("-100%");
						setStackPosition("0");
					});
				});
				timeoutRef.current = setTimeout(() => {
					setShowFallback(false);
				}, stackContext.animationDuration);
			}
		}

		return () => {
			resetAnimation();
		};
	}, [isOpen, stackContext.isTransitioning, stackContext.animationDuration]);

	return (
		<section
			style={{
				overflowX: "hidden",
				display: "contents", // Inherit parent paddings
			}}
		>
			{showFallback && (
				<Stack
					style={{
						transform: `translateX(${fallbackPosition})`,
						transition: `transform ${stackContext.animationDuration}ms ease`,
					}}
				>
					{fallbackContent}
				</Stack>
			)}
			{showStack && (
				<Box
					style={{
						position: "absolute",
						inset: 0,
						transform: `translateX(${stackPosition})`,
						transition: `transform ${stackContext.animationDuration}ms ease`,
					}}
				>
					{children}
				</Box>
			)}
		</section>
	);
}
