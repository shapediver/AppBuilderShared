export type {MantineCssLength, MantineFlexWrap, MantineSpacing} from "./group";

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
