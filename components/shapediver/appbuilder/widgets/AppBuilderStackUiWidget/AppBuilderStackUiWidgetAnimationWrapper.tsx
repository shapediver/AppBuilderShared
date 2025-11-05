import {AppBuilderStackContext} from "@AppBuilderShared/context/StackContext";
import {Box, Stack} from "@mantine/core";
import React, {useContext, useEffect, useRef, useState} from "react";

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

	useEffect(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		if (isOpen) {
			if (stackContext.isTransitioning) {
				// Backward (clicking "back"): left to right
				setShowFallback(true);
				setStackPosition("0");
				setFallbackPosition("-100%");
				setTimeout(() => {
					setFallbackPosition("0");
					setStackPosition("100%");
				}, 10);
				timeoutRef.current = setTimeout(() => {
					setShowStack(false);
				}, stackContext.animationDuration);
			} else {
				// Forward (clicking button): right to left
				setShowStack(true);
				setShowFallback(true);
				setStackPosition("100%");
				setFallbackPosition("0");
				setTimeout(() => {
					setFallbackPosition("-100%");
					setStackPosition("0");
				}, 10);
				timeoutRef.current = setTimeout(() => {
					setShowFallback(false);
				}, stackContext.animationDuration);
			}
		}
	}, [isOpen, stackContext.isTransitioning, stackContext.animationDuration]);

	return (
		<section
			style={{
				overflowX: "hidden",
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
