import {FocusEvent, useCallback, useEffect, useState} from "react";
export const useFocus = () => {
	const [focusedElement, setFocusedElement] = useState<
		HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | null
	>(null);
	const onFocusHandler = useCallback(
		(
			e: FocusEvent<
				HTMLInputElement | HTMLTextAreaElement | HTMLDivElement
			>,
		) => {
			if (e.target) {
				setFocusedElement(
					e.target as
						| HTMLInputElement
						| HTMLTextAreaElement
						| HTMLDivElement,
				);
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
