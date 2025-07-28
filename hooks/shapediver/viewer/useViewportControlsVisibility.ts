import {useEffect, useRef, useState} from "react";

export function useViewportControlsVisibility(delay = 3000) {
	const [showControls, setShowControls] = useState(true);
	const [isTouchDevice, setIsTouchDevice] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const touchStartRef = useRef<{
		x: number;
		y: number;
		timestamp: number;
	} | null>(null);
	const touchMoveRef = useRef(false);

	const showControlsHandler = () => {
		setShowControls(true);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			setShowControls(false);
		}, delay);
	};

	const hideControlsHandler = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		setShowControls(false);
	};

	const toggleControlsHandler = () => {
		if (showControls) {
			hideControlsHandler();
		} else {
			showControlsHandler();
		}
	};

	const clearTimeoutHandler = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	};

	const handleTouchStart = (e: React.TouchEvent) => {
		const touch = e.touches[0];
		touchStartRef.current = {
			x: touch.clientX,
			y: touch.clientY,
			timestamp: Date.now(),
		};
		touchMoveRef.current = false;
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		if (touchStartRef.current) {
			const touch = e.touches[0];
			const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
			const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

			const swipeThreshold = 10;
			if (deltaX > swipeThreshold || deltaY > swipeThreshold) {
				touchMoveRef.current = true;
			}
		}
	};

	const handleTouchEnd = (e: React.TouchEvent) => {
		if (touchStartRef.current && !touchMoveRef.current) {
			const touchDuration = Date.now() - touchStartRef.current.timestamp;
			if (touchDuration < 300) {
				e.preventDefault();
				toggleControlsHandler();
			}
		}

		touchStartRef.current = null;
		touchMoveRef.current = false;
	};

	useEffect(() => {
		const checkTouchDevice = () => {
			setIsTouchDevice(
				"ontouchstart" in window ||
					navigator.maxTouchPoints > 0 ||
					window.matchMedia("(pointer: coarse)").matches,
			);
		};

		checkTouchDevice();
		window.addEventListener("resize", checkTouchDevice);
		const initialTimer = setTimeout(() => {
			showControlsHandler();
		}, 100);

		return () => {
			clearTimeout(initialTimer);
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			window.removeEventListener("resize", checkTouchDevice);
		};
	}, []);

	return {
		showControls,
		containerProps: {
			onMouseMove: showControlsHandler,
			onMouseLeave: hideControlsHandler,
			onMouseEnter: () => {
				clearTimeoutHandler();
				showControlsHandler();
			},
			onTouchStart: isTouchDevice ? handleTouchStart : undefined,
			onTouchMove: isTouchDevice ? handleTouchMove : undefined,
			onTouchEnd: isTouchDevice ? handleTouchEnd : undefined,
		},
	};
}
