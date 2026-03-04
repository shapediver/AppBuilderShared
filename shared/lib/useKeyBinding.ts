import {useEffect} from "react";

interface Props {
	key: string;
	timeout: number;
	hits: number;
	callback: () => void;
}

/**
 * Hook providing a key binding.
 *
 * @param props
 * @returns
 */
export function useKeyBinding(props: Props) {
	const {key, timeout, hits, callback} = props;

	useEffect(() => {
		// event handler for toggling configurator visibility
		let count = 0;
		let timer: ReturnType<typeof setTimeout>;

		const cb = (event: KeyboardEvent) => {
			if (event.key === key) {
				count++;

				if (count === 1) {
					// Start the timer on the first key press
					timer = setTimeout(() => {
						// Reset the counter if the time window expires
						count = 0;
					}, timeout);
				}

				if (count === hits) {
					// If the key is pressed X times within Y milliseconds
					clearTimeout(timer); // Clear the timer to prevent reset
					callback(); // Call the event handler
					count = 0; // Reset the counter after the event is handled
				}
			} else count = 0; // Reset the counter if the wrong key is pressed
		};

		document.addEventListener("keydown", cb);

		return () => document.removeEventListener("keydown", cb);
	}, [key, timeout, hits, callback]);

	return {};
}
