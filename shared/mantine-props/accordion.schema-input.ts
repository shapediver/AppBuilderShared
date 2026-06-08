import type {MantineStylesApi} from "./primitives.schema-input";

/**
 * Serializable subset of Mantine `Accordion` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/accordion/
 * @strict
 */
export interface MantineAccordionProps {
	styles?: MantineStylesApi;
}
