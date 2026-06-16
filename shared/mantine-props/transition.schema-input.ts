/** Named Mantine transitions (subset of `@mantine/core` `MantineTransitionName`). */
export type MantineTransitionName =
	| "fade"
	| "fade-down"
	| "fade-up"
	| "fade-left"
	| "fade-right"
	| "skew-up"
	| "skew-down"
	| "rotate-right"
	| "rotate-left"
	| "slide-down"
	| "slide-up"
	| "slide-right"
	| "slide-left"
	| "scale-y"
	| "scale-x"
	| "scale"
	| "pop"
	| "pop-top-left"
	| "pop-top-right"
	| "pop-bottom-left"
	| "pop-bottom-right";

/**
 * Serializable subset of Mantine `Transition` props for theme `defaultProps`.
 * @strict
 */
export interface MantineTransitionProps {
	transition?: MantineTransitionName;
	duration?: number;
	timingFunction?: string;
	keepMounted?: boolean;
}
