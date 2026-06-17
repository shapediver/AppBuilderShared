import type {MantineCssStyleRecord} from "./primitives.schema-input";

/** Serializable subset of Mantine `Select` props for theme `defaultProps`. */
export interface MantineSelectProps {
	style?: MantineCssStyleRecord;
	label?: string;
	placeholder?: string;
}
