import type {
	AccordionProps,
	ButtonProps,
	GroupProps,
	PaperProps,
	TextProps,
} from "@mantine/core";
import type {MantineAccordionProps} from "./accordion";
import type {MantineButtonProps} from "./button";
import type {MantineGroupProps} from "./group";
import type {MantinePaperProps} from "./paper";
import type {MantineTextProps} from "./text";
import type {MantinePropsSubset} from "./mantine-props-subset";

type _MantineGroupPropsSubset = MantinePropsSubset<GroupProps, MantineGroupProps>;
type _MantineButtonPropsSubset = MantinePropsSubset<ButtonProps, MantineButtonProps>;
type _MantineTextPropsSubset = MantinePropsSubset<TextProps, MantineTextProps>;
type _MantinePaperPropsSubset = MantinePropsSubset<PaperProps, MantinePaperProps>;
type _MantineAccordionPropsSubset = MantinePropsSubset<
	AccordionProps,
	MantineAccordionProps
>;

declare const assertGroup: _MantineGroupPropsSubset;
declare const assertButton: _MantineButtonPropsSubset;
declare const assertText: _MantineTextPropsSubset;
declare const assertPaper: _MantinePaperPropsSubset;
declare const assertAccordion: _MantineAccordionPropsSubset;
void assertGroup;
void assertButton;
void assertText;
void assertPaper;
void assertAccordion;
