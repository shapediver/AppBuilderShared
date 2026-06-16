import type {MantineSpacing} from "./spacing.schema-input";

/** Serializable subset of Mantine `SimpleGrid` props for theme `defaultProps`. */
export interface MantineSimpleGridProps {
	cols?: number;
	spacing?: MantineSpacing;
}
