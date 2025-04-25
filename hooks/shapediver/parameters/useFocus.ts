import {FocusEvent, useCallback, useEffect, useState} from "react";
export const useFocus = () => {
	const [focusedElement, setFocusedElement] =
		useState<HTMLInputElement | null>(null);
	const onFocusHandler = useCallback(
		(e: FocusEvent<HTMLInputElement>) => {
			if (e.target) {
				setFocusedElement(e.target as HTMLInputElement);
			}
		},
		[focusedElement],
	);
	const restoreFocus = useCallback(() => {
		if (focusedElement) {
			focusedElement.focus();
		}
	}, [focusedElement]);
	const onBlurHandler = useCallback(() => {
		setFocusedElement(null);
	}, [focusedElement]);

	useEffect(() => {
		return () => {
			setFocusedElement(null);
		};
	}, []);

	return {focusedElement, onFocusHandler, restoreFocus, onBlurHandler};
};
