import Icon from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {Carousel} from "@mantine/carousel";
import "@mantine/carousel/styles.css";
import {MantineThemeComponent, useProps} from "@mantine/core";
import React, {useCallback, useMemo} from "react";
import ButtonImageCard from "./ButtonImageCard";
import classes from "./SelectCarouselComponent.module.css";
import {
	SelectCardStyleProps,
	SelectCarouselStyleProps,
	SelectComponentProps,
	SelectImageStyleProps,
	SelectStackStyleProps,
	SelectTextStyleProps,
	SelectTextWeightedStyleProps,
} from "./SelectComponent";

interface StyleProps {
	carouselProps: SelectCarouselStyleProps;
	cardProps: SelectCardStyleProps;
	imageProps: SelectImageStyleProps;
	stackProps: SelectStackStyleProps;
	labelProps: SelectTextWeightedStyleProps;
	descriptionProps: SelectTextStyleProps;
	showLabel: boolean;
}

export const defaultStyleProps: Partial<StyleProps> = {
	carouselProps: {
		align: "start",
		height: "auto",
		loop: true,
		slideGap: {base: "xs"},
		slideSize: {
			base: "100%",
			"16em": "50%",
			"32em": "33.333333%",
			"48em": "25%",
			"64em": "20%",
		},
		type: "container",
		withIndicators: false,
	},
	cardProps: {},
	imageProps: {
		fit: "cover",
		fallbackSrc: "not-found.svg",
	},
	stackProps: {gap: "xs"},
	labelProps: {size: "sm", fontWeight: "medium"},
	descriptionProps: {size: "sm", c: "dimmed"},
	showLabel: true,
};

type SelectCarouselComponentThemePropsType = Partial<StyleProps>;

export function SelectCarouselComponentThemeProps(
	props: SelectCarouselComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that displays selectable items in a carousel with images.
 * Images can be displayed with or without title/description.
 * The carousel is responsive based on container width.
 */
export default function SelectCarouselComponent(
	props: SelectComponentProps & SelectCarouselComponentThemePropsType,
) {
	const {
		value,
		onChange,
		items,
		disabled,
		itemData,
		settings,
		...styleProps
	} = props;

	// style properties
	const {
		carouselProps,
		cardProps,
		imageProps,
		stackProps,
		labelProps,
		descriptionProps,
		showLabel: _showLabel,
	} = useProps("SelectCarouselComponent", defaultStyleProps, styleProps);

	const showLabel = settings?.showLabel ?? _showLabel;

	// Transform items array into the format expected by the component
	const carouselItems = useMemo(
		() =>
			items.map((item) => {
				const data = itemData?.[item];

				return {
					value: item,
					label: data?.displayname || item,
					description: data?.description,
					imageUrl: data?.imageUrl,
					color: data?.color,
					tooltip: data?.tooltip,
				};
			}),
		[items, itemData],
	);

	// Index of initial slide to show.
	// Note: On purpose we do not change this dependent on the value, to prevent the carousel from jumping around.
	const initialSlideIndex = useMemo(() => {
		const index = items.findIndex((item) => item === value);
		return index === -1 ? 0 : index;
	}, [items]);

	// Handle card selection
	const handleCardClick = useCallback(
		(itemValue: string, disabled: boolean | undefined) => {
			if (!disabled) {
				onChange(itemValue);
			}
		},
		[onChange],
	);

	// Extract card-related props for spreading
	const cardStyleProps = {
		cardProps,
		imageProps,
		stackProps,
		labelProps,
		descriptionProps,
	};

	return (
		<Carousel
			initialSlide={initialSlideIndex}
			nextControlIcon={<Icon type={IconTypeEnum.ChevronRight} />}
			previousControlIcon={<Icon type={IconTypeEnum.ChevronLeft} />}
			classNames={{
				indicators: classes.indicators,
				indicator: classes.indicator,
			}}
			{...carouselProps}
			withIndicators={
				carouselProps?.withIndicators && items.length > 2
					? true
					: undefined
			}
			{...settings?.carouselProps}
		>
			{carouselItems.map((item) => (
				<Carousel.Slide key={item.value}>
					<div className={`${classes.cardWrapper}`}>
						<ButtonImageCard
							item={item}
							selected={value === item.value}
							disabled={disabled}
							onClick={handleCardClick}
							showLabel={showLabel}
							settings={settings}
							{...cardStyleProps}
						/>
					</div>
				</Carousel.Slide>
			))}
		</Carousel>
	);
}
