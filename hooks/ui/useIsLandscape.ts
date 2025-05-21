import {useMediaQuery} from "@mantine/hooks";

/**
 * Hook for deciding whether the device is in landscape orientation.
 * @returns boolean
 */
export const useIsLandscape = () =>
	useMediaQuery(
		"(orientation: landscape)",
		false, // Mobile first
		{getInitialValueInEffect: false},
	);
