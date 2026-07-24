import type {MantineFlexWrap} from "./primitives.schema-input";
import type {MantineSpacing} from "./spacing.schema-input";

/**
 * Serializable subset of Mantine `Flex` props for theme `defaultProps`.
 * @see https://mantine.dev/core/flex/
 * @strict
 */
export interface MantineFlexProps {
	justify?: string;
	align?: string;
	gap?: MantineSpacing;
	wrap?: MantineFlexWrap;
	direction?:
		| "row"
		| "column"
		| "row-reverse"
		| "column-reverse"
		| {
				base?: "row" | "column" | "row-reverse" | "column-reverse";
				xs?: "row" | "column" | "row-reverse" | "column-reverse";
				sm?: "row" | "column" | "row-reverse" | "column-reverse";
				md?: "row" | "column" | "row-reverse" | "column-reverse";
				lg?: "row" | "column" | "row-reverse" | "column-reverse";
				xl?: "row" | "column" | "row-reverse" | "column-reverse";
		  };
}
