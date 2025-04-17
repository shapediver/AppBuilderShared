import {FocusEvent, useEffect, useState} from "react";
export const useFocus = () => {
	const [focusedElement, setFocusedElement] =
		useState<HTMLInputElement | null>(null);
	const onFocusHandler = (e: FocusEvent<HTMLInputElement>) => {
		if (e.target) {
			setFocusedElement(e.target as HTMLInputElement);
		}
	};
	const restoreFocus = () => {
		if (focusedElement) {
			focusedElement.focus();
		}
	};
	const onBlurHandler = () => {
		setFocusedElement(null);
	};

	useEffect(() => {
		return () => {
			setFocusedElement(null);
		};
	}, []);

	return {focusedElement, onFocusHandler, restoreFocus, onBlurHandler};
};
