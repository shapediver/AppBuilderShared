export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | string | number;

export type MantineResponsiveCssSize =
	| string
	| number
	| {
			base?: string | number;
			xs?: string | number;
			sm?: string | number;
			md?: string | number;
			lg?: string | number;
			xl?: string | number;
	  };

/**
 * Serializable subset of Mantine `Button` props for settings theme `defaultProps`.
 * @see https://mantine.dev/core/button/
 * @strict
 */
export interface MantineButtonProps {
	fw?: string | number;
	mt?: MantineSpacing;
	fz?: MantineResponsiveCssSize;
	h?: MantineResponsiveCssSize;
	variant?: string;
	size?: MantineSpacing;
	fullWidth?: boolean;
}
