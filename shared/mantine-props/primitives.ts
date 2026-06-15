export type {MantineSizeToken, MantineSpacing} from "./spacing.schema-input";
export type {
	MantineCssLength,
	MantineFlexWrap,
	MantineStylesApiValue,
	MantineStylesApi,
	MantineResponsiveCssSize,
	MantineBreakpoint,
	MantineResponsiveNumber,
	MantineResponsiveBoolean,
} from "./primitives.schema-input";

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
