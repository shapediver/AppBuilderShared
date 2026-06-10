/** Serializable subset of Mantine `Transition` props for theme `defaultProps`. */
export interface MantineTransitionProps {
	transition?: string;
	duration?: number;
	timingFunction?: string;
	keepMounted?: boolean;
}
