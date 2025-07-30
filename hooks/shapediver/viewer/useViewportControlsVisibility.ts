import {SystemInfo} from "@shapediver/viewer.session";
import {useEffect, useRef, useState} from "react";

export function useViewportControlsVisibility(delay = 3000) {
	const [showControls, setShowControls] = useState(true);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showControlsHandler = () => {
		setShowControls(true);

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		if (SystemInfo.instance.isMobile) {
			return; // Do not hide controls on mobile
		}

		timeoutRef.current = setTimeout(() => {
			setShowControls(false);
		}, delay);
	};

	const hideControlsHandler = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		if (SystemInfo.instance.isMobile) {
			return; // Do not hide controls on mobile
		}

		timeoutRef.current = setTimeout(() => {
			setShowControls(false);
		}, delay);
	};

	useEffect(() => {
		if (SystemInfo.instance.isMobile) {
			return; // Do not hide controls on mobile
		}

		const initialTimer = setTimeout(() => {
			showControlsHandler();
		}, 100);

		return () => {
			clearTimeout(initialTimer);
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return {
		showControls,
		containerProps: {
			onMouseMove: showControlsHandler,
			onMouseLeave: hideControlsHandler,
			onMouseEnter: showControlsHandler,
		},
	};
}
