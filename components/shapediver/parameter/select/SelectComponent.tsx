import {TextWeightedProps} from "@AppBuilderShared/components/ui/TextWeighted";
import {
	ISelectComponentItemDataType,
	SelectComponentType,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {CarouselProps} from "@mantine/carousel";
import {
	ButtonProps,
	CardProps,
	FlexProps,
	GroupProps,
	ImageProps,
	StackProps,
	TextProps,
} from "@mantine/core";
import React from "react";
import SelectButtonFlexComponent from "./SelectButtonFlexComponent";
import SelectButtonGroupComponent from "./SelectButtonGroupComponent";
import SelectCarouselComponent from "./SelectCarouselComponent";
import SelectChipGroupComponent from "./SelectChipGroupComponent";
import SelectColorComponent from "./SelectColorComponent";
import SelectDropDownComponent from "./SelectDropDownComponent";
import SelectFullWidthCardsComponent from "./SelectFullWidthCards";
import SelectGridComponent from "./SelectGridComponent";
import SelectImageDropDownComponent from "./SelectImageDropDownComponent";

export type SelectButtonStyleProps = Omit<ButtonProps, "children">;
export type SelectCarouselStyleProps = Pick<
	CarouselProps,
	| "controlSize"
	| "controlsOffset"
	| "draggable"
	| "emblaOptions"
	| "height"
	| "includeGapInSize"
	| "orientation"
	| "slideGap"
	| "slideSize"
	| "type"
	| "withControls"
	| "withIndicators"
	| "withKeyboardEvents"
>;
export type SelectCardStyleProps = Omit<CardProps, "children">;
export type SelectFlexStyleProps = Omit<FlexProps, "children">;
export type SelectGroupStyleProps = Omit<GroupProps, "children">;
export type SelectImageStyleProps = Omit<ImageProps, "src" | "alt" | "onError">;
export type SelectStackStyleProps = Omit<StackProps, "children">;
export type SelectTextWeightedStyleProps = Omit<TextWeightedProps, "children">;
export type SelectTextStyleProps = Omit<TextProps, "children">;

export interface SelectComponentSettings {
	buttonProps?: SelectButtonStyleProps;
	carouselProps?: SelectCarouselStyleProps;
	cardProps?: SelectCardStyleProps;
	flexProps?: SelectFlexStyleProps;
	groupProps?: SelectGroupStyleProps;
	gridProps?: {
		cols?: Record<string, number>;
		spacing?: string;
	};
	imageProps?: SelectImageStyleProps;
	stackProps?: SelectStackStyleProps;
	labelProps?: SelectTextWeightedStyleProps;
	descriptionProps?: SelectTextStyleProps;
	showLabel?: boolean;
}

export interface SelectComponentProps {
	/** Controlled value (item name). */
	value: string | null | undefined;
	/** Handler for updating the value. */
	onChange: (value: string | null) => void;
	/** Item names that can be selected, must be unique. */
	items: string[];
	/** Record containing optional further item data per item name. */
	itemData?: Record<string, ISelectComponentItemDataType>;
	/** Whether the component shall be disabled. */
	disabled?: boolean;
	/** Component-specific settings (e.g. width for SelectImageDropDownComponent). */
	settings?: SelectComponentSettings;
	/** Optional function to wrap the input component in a custom container. */
	inputContainer?: (children: React.ReactNode) => React.ReactNode;
	/** Optional function to handle focus events. */
	onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
	/** Optional function to handle blur events. */
	onBlur?: () => void;
}

interface SelectComponentPropsExt extends SelectComponentProps {
	/** Type of select component to use. */
	type?: SelectComponentType;
}

/**
 * Functional select component.
 * At most one item can be selected at a time.
 */
export default function SelectComponent(props: SelectComponentPropsExt) {
	const {type, ...rest} = props;

	if (type === "buttonflex") {
		return <SelectButtonFlexComponent {...rest} />;
	} else if (type === "buttongroup") {
		return <SelectButtonGroupComponent {...rest} />;
	} else if (type === "chipgroup") {
		return <SelectChipGroupComponent {...rest} />;
	} else if (type === "color") {
		return <SelectColorComponent {...rest} />;
	} else if (type === "imagedropdown") {
		return <SelectImageDropDownComponent {...rest} />;
	} else if (type === "fullwidthcards") {
		return <SelectFullWidthCardsComponent {...rest} />;
	} else if (type === "carousel") {
		return <SelectCarouselComponent {...rest} />;
	} else if (type === "grid") {
		return <SelectGridComponent {...rest} />;
	} else {
		return <SelectDropDownComponent {...rest} />;
	}
}
