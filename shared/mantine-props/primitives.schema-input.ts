/**
 * Codegen input for shared Mantine JSON primitive Zod schemas.
 * @see primitives.ts — re-exports these types for mirror / app imports.
 */

export type MantineCssLength = string | number;

export type MantineFlexWrap = "nowrap" | "wrap" | "wrap-reverse";

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
