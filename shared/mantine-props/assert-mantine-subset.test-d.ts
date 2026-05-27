import type {
	AccordionProps,
	BoxProps,
	ButtonProps,
	GroupProps,
	PaperProps,
	StackProps,
	TextProps,
	TooltipProps,
} from "@mantine/core";
import type {MantineAccordionProps} from "./accordion";
import type {MantineBoxProps} from "./box";
import type {MantineButtonProps} from "./button";
import type {MantineGroupProps} from "./group";
import type {MantinePaperProps} from "./paper";
import type {MantineStackProps} from "./stack";
import type {MantineTextProps} from "./text";
import type {MantineTooltipProps} from "./tooltip";
import type {MantinePropsSubset} from "./mantine-props-subset";

type _MantineGroupPropsSubset = MantinePropsSubset<GroupProps, MantineGroupProps>;
type _MantineButtonPropsSubset = MantinePropsSubset<ButtonProps, MantineButtonProps>;
type _MantineTextPropsSubset = MantinePropsSubset<TextProps, MantineTextProps>;
type _MantinePaperPropsSubset = MantinePropsSubset<PaperProps, MantinePaperProps>;
type _MantineAccordionPropsSubset = MantinePropsSubset<
	AccordionProps,
	MantineAccordionProps
>;
type _MantineStackPropsSubset = MantinePropsSubset<StackProps, MantineStackProps>;
type _MantineBoxPropsSubset = MantinePropsSubset<BoxProps, MantineBoxProps>;
type _MantineTooltipPropsSubset = MantinePropsSubset<
	Pick<TooltipProps, keyof MantineTooltipProps>,
	MantineTooltipProps
>;

declare const assertGroup: _MantineGroupPropsSubset;
declare const assertButton: _MantineButtonPropsSubset;
declare const assertText: _MantineTextPropsSubset;
declare const assertPaper: _MantinePaperPropsSubset;
declare const assertAccordion: _MantineAccordionPropsSubset;
declare const assertStack: _MantineStackPropsSubset;
declare const assertBox: _MantineBoxPropsSubset;
declare const assertTooltip: _MantineTooltipPropsSubset;
void assertGroup;
void assertButton;
void assertText;
void assertPaper;
void assertAccordion;
void assertStack;
void assertBox;
void assertTooltip;
