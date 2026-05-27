export type MantineSpacing = "xs" | "sm" | "md" | "lg" | "xl" | (string & {}) | number;

export type MantineResponsive<T> =
	| T
	| {
			base?: T;
			xs?: T;
			sm?: T;
			md?: T;
			lg?: T;
			xl?: T;
	  };

export type MantineFlexWrap = "nowrap" | "wrap" | "wrap-reverse";

export type MantineCssLength = string | number;
