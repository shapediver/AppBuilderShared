import {useMatches} from "@mantine/core";

/**
 * Type for responsive values.
 */
export type ResponsiveValueType<T> =
	| {
			base?: T;
			xs?: T;
			sm?: T;
			md?: T;
			lg?: T;
			xl?: T;
			[key: string]: T | undefined;
	  }
	| T;

/**
 * Hook for choosing values according to device with (responsive).
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function useResponsiveValueSelector<T extends {}>(
	value: ResponsiveValueType<T>,
) {
	const match = useMatches(typeof value === "object" ? value : {base: value});

	return match;
}
