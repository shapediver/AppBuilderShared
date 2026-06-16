/**
 * Codegen input for shared Mantine JSON primitive Zod schemas.
 * @see primitives.ts — re-exports these types for mirror / app imports.
 */

export type MantineCssLength = string | number;

/** Serializable inline `style` object (CSS property name → string or number value). */
export type MantineCssStyleRecord = Record<string, string | number>;

export type MantineFlexWrap = "nowrap" | "wrap" | "wrap-reverse";

/** Mantine floating-ui position (Tooltip, Menu, Popover, etc.) */
export type MantineFloatingPosition =
	| "top"
	| "right"
	| "bottom"
	| "left"
	| "top-start"
	| "top-end"
	| "bottom-start"
	| "bottom-end"
	| "left-start"
	| "left-end"
	| "right-start"
	| "right-end";

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

/** Mantine theme breakpoint token (`xs`–`xl`). */
export type MantineBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";

export type MantineResponsiveNumber =
	| number
	| {
			base?: number;
			xs?: number;
			sm?: number;
			md?: number;
			lg?: number;
			xl?: number;
	  };

export type MantineResponsiveBoolean =
	| boolean
	| {
			base?: boolean;
			xs?: boolean;
			sm?: boolean;
			md?: boolean;
			lg?: boolean;
			xl?: boolean;
	  };
