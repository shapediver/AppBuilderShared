export type MantineStylesApiValue = string | number | boolean | null;

export type MantineStylesApi = {
	[selector: string]:
		| {
				[property: string]:
					| MantineStylesApiValue
					| MantineStylesApi
					| MantineStylesApiValue[];
		  }
		| undefined;
};

/**
 * Serializable subset of Mantine `Accordion` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/accordion/
 * @strict
 */
export interface MantineAccordionProps {
	styles?: MantineStylesApi;
}
