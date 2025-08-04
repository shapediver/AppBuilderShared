import {useCallback, useEffect, useRef} from "react";

export function useDebounce<T extends (...args: any[]) => void>(
	callback: T,
	delay: number,
): T {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const debouncedCallback = useCallback(
		((...args: any[]) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			timeoutRef.current = setTimeout(() => {
				callback(...args);
			}, delay);
		}) as T,
		[callback, delay],
	);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debouncedCallback;
}
