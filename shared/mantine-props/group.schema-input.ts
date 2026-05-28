export type MantineCssLength = string | number;

export type MantineFlexWrap = "nowrap" | "wrap" | "wrap-reverse";

export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | string | number;

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
 * Serializable subset of Mantine `Group` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/group/
 * @strict
 */
export interface MantineGroupProps {
	w?: MantineCssLength;
	h?: MantineCssLength;
	justify?: string;
	wrap?: MantineFlexWrap;
	p?: MantineSpacing;
	pt?: MantineSpacing;
	pb?: MantineSpacing;
	styles?: MantineStylesApi;
}
