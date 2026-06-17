export type {
	MantineBreakpoint,
	MantineCssLength,
	MantineFlexWrap,
	MantineResponsiveBoolean,
	MantineResponsiveCssSize,
	MantineResponsiveNumber,
	MantineStylesApi,
	MantineStylesApiValue,
} from "./primitives.schema-input";
export type {MantineSizeToken, MantineSpacing} from "./spacing.schema-input";

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
