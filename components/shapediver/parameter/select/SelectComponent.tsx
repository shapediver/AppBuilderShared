import {TextWeightedProps} from "@AppBuilderShared/components/ui/TextWeighted";
import {
	IScrollingApi,
	IScrollingApiItemTypeSelect,
} from "@AppBuilderShared/modules/ecommerce/types/scrollingapi";
import {useScrollingApiStore} from "@AppBuilderShared/store/useScrollingApiStore";
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
import React, {useEffect} from "react";
import {useShallow} from "zustand/react/shallow";
import SelectFullWidthCardsComponent from "~/shared/components/shapediver/parameter/select/SelectFullWidthCards";
import SelectButtonFlexComponent from "./SelectButtonFlexComponent";
import SelectButtonGroupComponent from "./SelectButtonGroupComponent";
import SelectCarouselComponent from "./SelectCarouselComponent";
import SelectChipGroupComponent from "./SelectChipGroupComponent";
import SelectColorComponent from "./SelectColorComponent";
import SelectDropDownComponent from "./SelectDropDownComponent";
import SelectFullWidthCardsAsyncComponent from "./SelectFullWidthCardsAsyncComponent";
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
	/** Enable search (only used by dropdown type). */
	searchable?: boolean;
	/** Max number of options rendered at the same time (only used by dropdown type with searchable). */
	limit?: number;
	/**
	 * Optional CSS controlling the absolute height of the widget.
	 * In case this is not specified, the default behavior of the widget
	 * is to adapt its height according to the items.
	 * This should always be specified in case of infinite scrolling.
	 */
	height?: string;
	/**
	 * Optional properties for infinite scrolling.
	 * Most of these properties can be used with the useInfiniteScroll hook,
	 * see example in the ModelLibrary component.
	 * https://www.npmjs.com/package/react-infinite-scroll-hook
	 *
	 * NOTE: If this property is defined, components must use property
	 * scrollingApi.items instead of items!!!
	 */
	scrollingApi?: IScrollingApi<IScrollingApiItemTypeSelect>;
}

interface SelectComponentPropsExt extends SelectComponentProps {
	/** Type of select component to use. */
	type?: SelectComponentType;
	/**
	 * Name of the "data source" to fetch items and item data from.
	 * This is used for connecting to data sources via the e-commerce API.
	 */
	source?: string;
}

/**
 * Functional select component.
 * At most one item can be selected at a time.
 */
export default function SelectComponent(props: SelectComponentPropsExt) {
	const {type, source, ...rest} = props;

	// scrolling API
	const {scrollingApi, addScrollingApiSelect, removeScrollingApiSelect} =
		useScrollingApiStore(
			useShallow((state) => ({
				scrollingApi: state.scrollingApisSelect[source ?? ""],
				addScrollingApiSelect: state.addScrollingApiSelect,
				removeScrollingApiSelect: state.removeScrollingApiSelect,
			})),
		);

	// if source changes, get new scrolling API
	useEffect(() => {
		if (source) {
			addScrollingApiSelect(source);
			// TODO remove debug code
			// const api = addScrollingApiSelect(source);
			// setInterval(async () => {
			// 	await api.loadMore();
			// }, 2000);
		}
		return () => {
			removeScrollingApiSelect(source ?? "");
		};
	}, [source]);

	// TODO remove debug code
	// useEffect(() => {
	// 	console.log("scrollingApi items", scrollingApi?.items);
	// }, [scrollingApi?.items]);

	// const rest = {..._rest, scrollingApi};

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
		if (rest.scrollingApi) {
			return <SelectFullWidthCardsAsyncComponent {...rest} />;
		} else {
			return <SelectFullWidthCardsComponent {...rest} />;
		}
	} else if (type === "carousel") {
		return <SelectCarouselComponent {...rest} />;
	} else if (type === "grid") {
		return <SelectGridComponent {...rest} />;
	} else {
		return <SelectDropDownComponent {...rest} />;
	}
}
