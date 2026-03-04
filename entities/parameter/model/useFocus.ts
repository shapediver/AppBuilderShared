import {FocusEvent, useCallback, useRef} from "react";
export const useFocus = () => {
	const focusedElementRef = useRef<
		HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | null
	>(null);

	const onFocusHandler = useCallback(
		(
			e: FocusEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLDivElement
			>,
		) => {
			if (e.target) {
				focusedElementRef.current = e.target;
			}
		},
		[],
	);

	const restoreFocus = useCallback(() => {
		setTimeout(() => focusedElementRef.current?.focus(), 0);
	}, []);

	const onBlurHandler = useCallback(() => {
		focusedElementRef.current = null;
	}, []);

	return {onFocusHandler, restoreFocus, onBlurHandler};
};
