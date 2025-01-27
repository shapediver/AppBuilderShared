import {BaseSyntheticEvent} from "react";

export const preventDefault =
	(fn: () => unknown) => (event: BaseSyntheticEvent) => {
		event.preventDefault();
		fn();
	};
