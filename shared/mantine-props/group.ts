import type {MantineCssLength, MantineFlexWrap, MantineSpacing} from "./primitives";

export interface MantineGroupProps {
	w?: MantineCssLength;
	h?: MantineCssLength;
	justify?: string;
	wrap?: MantineFlexWrap;
	p?: MantineSpacing;
}
