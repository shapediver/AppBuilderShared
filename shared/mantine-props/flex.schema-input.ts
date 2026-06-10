import type {MantineFlexWrap} from "./primitives.schema-input";
import type {MantineSpacing} from "./spacing.schema-input";

/** Serializable subset of Mantine `Flex` props for theme `defaultProps`. */
export interface MantineFlexProps {
	justify?: string;
	align?: string;
	gap?: MantineSpacing;
	wrap?: MantineFlexWrap;
}
