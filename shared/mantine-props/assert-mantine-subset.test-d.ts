// Public Mantine*Props types are z.infer-derived from generated schemas (see *.ts facades).
import type {
	AccordionControlProps,
	AccordionItemProps,
	AccordionPanelProps,
	AccordionProps,
	ActionIconProps,
	BadgeProps,
	BoxProps,
	ButtonProps,
	CardProps,
	CheckboxProps,
	DividerProps,
	FlexProps,
	GroupProps,
	ImageProps,
	MenuDropdownProps,
	MenuProps,
	PaperProps,
	StackProps,
	TextProps,
	TitleProps,
	TooltipProps,
	TransitionProps,
} from "@mantine/core";
import type {MantineAccordionProps} from "./accordion";
import type {MantineAccordionControlProps} from "./accordionControl";
import type {MantineAccordionItemProps} from "./accordionItem";
import type {MantineAccordionPanelProps} from "./accordionPanel";
import type {MantineActionIconProps} from "./actionIcon";
import type {MantineBadgeProps} from "./badge";
import type {MantineBoxProps} from "./box";
import type {MantineButtonProps} from "./button";
import type {MantineCardProps} from "./card";
import type {MantineCheckboxProps} from "./checkbox";
import type {MantineDividerProps} from "./divider";
import type {MantineFlexProps} from "./flex";
import type {MantineGroupProps} from "./group";
import type {MantineImageProps} from "./image";
import type {MantineMenuProps} from "./menu";
import type {MantineMenuDropdownProps} from "./menuDropdown";
import type {MantinePaperProps} from "./paper";
import type {MantineStackProps} from "./stack";
import type {MantineTextProps} from "./text";
import type {MantineTitleProps} from "./title";
import type {MantineTooltipProps} from "./tooltip";
import type {MantineTransitionProps} from "./transition";
import type {MantinePropsSubset} from "./mantine-props-subset";

type _MantineGroupPropsSubset = MantinePropsSubset<GroupProps, MantineGroupProps>;
type _MantineButtonPropsSubset = MantinePropsSubset<ButtonProps, MantineButtonProps>;
type _MantineTextPropsSubset = MantinePropsSubset<TextProps, MantineTextProps>;
type _MantinePaperPropsSubset = MantinePropsSubset<PaperProps, MantinePaperProps>;
type _MantineAccordionPropsSubset = MantinePropsSubset<
	AccordionProps,
	MantineAccordionProps
>;
type _MantineAccordionControlPropsSubset = MantinePropsSubset<
	AccordionControlProps,
	MantineAccordionControlProps
>;
type _MantineAccordionItemPropsSubset = MantinePropsSubset<
	AccordionItemProps,
	MantineAccordionItemProps
>;
type _MantineAccordionPanelPropsSubset = MantinePropsSubset<
	AccordionPanelProps,
	MantineAccordionPanelProps
>;
type _MantineMenuPropsSubset = MantinePropsSubset<
	Pick<MenuProps, keyof MantineMenuProps>,
	MantineMenuProps
>;
type _MantineMenuDropdownPropsSubset = MantinePropsSubset<
	Pick<MenuDropdownProps, keyof MantineMenuDropdownProps>,
	MantineMenuDropdownProps
>;
type _MantineStackPropsSubset = MantinePropsSubset<StackProps, MantineStackProps>;
type _MantineBoxPropsSubset = MantinePropsSubset<BoxProps, MantineBoxProps>;
type _MantineTooltipPropsSubset = MantinePropsSubset<
	Pick<TooltipProps, keyof MantineTooltipProps>,
	MantineTooltipProps
>;
type _MantineActionIconPropsSubset = MantinePropsSubset<
	ActionIconProps,
	MantineActionIconProps
>;
type _MantineCheckboxPropsSubset = MantinePropsSubset<
	CheckboxProps,
	MantineCheckboxProps
>;
type _MantineTitlePropsSubset = MantinePropsSubset<TitleProps, MantineTitleProps>;
type _MantineBadgePropsSubset = MantinePropsSubset<BadgeProps, MantineBadgeProps>;
type _MantineDividerPropsSubset = MantinePropsSubset<
	DividerProps,
	MantineDividerProps
>;
type _MantineTransitionPropsSubset = MantinePropsSubset<
	TransitionProps,
	MantineTransitionProps
>;
type _MantineCardPropsSubset = MantinePropsSubset<CardProps, MantineCardProps>;
type _MantineImagePropsSubset = MantinePropsSubset<ImageProps, MantineImageProps>;
type _MantineFlexPropsSubset = MantinePropsSubset<FlexProps, MantineFlexProps>;

declare const assertGroup: _MantineGroupPropsSubset;
declare const assertButton: _MantineButtonPropsSubset;
declare const assertText: _MantineTextPropsSubset;
declare const assertPaper: _MantinePaperPropsSubset;
declare const assertAccordion: _MantineAccordionPropsSubset;
declare const assertAccordionControl: _MantineAccordionControlPropsSubset;
declare const assertAccordionItem: _MantineAccordionItemPropsSubset;
declare const assertAccordionPanel: _MantineAccordionPanelPropsSubset;
declare const assertMenu: _MantineMenuPropsSubset;
declare const assertMenuDropdown: _MantineMenuDropdownPropsSubset;
declare const assertStack: _MantineStackPropsSubset;
declare const assertBox: _MantineBoxPropsSubset;
declare const assertTooltip: _MantineTooltipPropsSubset;
declare const assertActionIcon: _MantineActionIconPropsSubset;
declare const assertCheckbox: _MantineCheckboxPropsSubset;
declare const assertTitle: _MantineTitlePropsSubset;
declare const assertBadge: _MantineBadgePropsSubset;
declare const assertDivider: _MantineDividerPropsSubset;
declare const assertTransition: _MantineTransitionPropsSubset;
declare const assertCard: _MantineCardPropsSubset;
declare const assertImage: _MantineImagePropsSubset;
declare const assertFlex: _MantineFlexPropsSubset;
void assertGroup;
void assertButton;
void assertText;
void assertPaper;
void assertAccordion;
void assertAccordionControl;
void assertAccordionItem;
void assertAccordionPanel;
void assertMenu;
void assertMenuDropdown;
void assertStack;
void assertBox;
void assertTooltip;
void assertActionIcon;
void assertCheckbox;
void assertTitle;
void assertBadge;
void assertDivider;
void assertTransition;
void assertCard;
void assertImage;
void assertFlex;
