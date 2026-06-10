import type {MantineCssStyleRecord} from "./primitives.schema-input";
import type {MantineSizeToken} from "./spacing.schema-input";

/** Serializable subset of Mantine `ActionIcon` props for theme `defaultProps`. */
export interface MantineActionIconProps {
	variant?: string;
	size?: MantineSizeToken | number;
	style?: MantineCssStyleRecord;
	/** Nested loader props (e.g. `{ type: "dots" }`). */
	loaderProps?: {type?: string};
}
