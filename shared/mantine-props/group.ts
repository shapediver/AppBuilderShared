export type MantineCssLength = string | number;

export type MantineFlexWrap = "nowrap" | "wrap" | "wrap-reverse";

export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | string | number;

/**
 * @strict
 */
export interface MantineGroupProps {
	w?: MantineCssLength;
	h?: MantineCssLength;
	justify?: string;
	wrap?: MantineFlexWrap;
	p?: MantineSpacing;
}
