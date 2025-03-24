import Icon from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {Carousel} from "@mantine/carousel";
import "@mantine/carousel/styles.css";
import {
	Box,
	Card,
	Image,
	MantineThemeComponent,
	MantineThemeOverride,
	StyleProp,
	Text,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo} from "react";
import classes from "./SelectCarouselComponent.module.css";
import {SelectComponentProps} from "./SelectComponent";

interface StyleProps {
	slideSize: StyleProp<string | number>;
	slideGap: StyleProp<string | number>;
	height: string | number;
	themeOverride?: MantineThemeOverride;
}

export const defaultStyleProps: Partial<StyleProps> = {
	slideSize: {base: "100%", "200px": "50%", "500px": "33.333333%"},
	slideGap: {base: 0, "200px": "md"},
	height: "auto",
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
	// style properties
	const {
		value,
		onChange,
		items,
		disabled,
		itemData,
		settings,
		slideSize,
		slideGap,
		height,
		themeOverride,
	} = useProps("SelectCarouselComponent", defaultStyleProps, props);

	const imageFit = settings?.imageFit || "cover";
	const withIndicators = settings?.withIndicators !== false;

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
				};
			}),
		[items, itemData],
	);

	// Handle card selection
	const handleCardClick = useCallback(
		(itemValue: string, disabled: boolean | undefined) => {
			if (!disabled) {
				onChange(itemValue);
			}
		},
		[onChange],
	);

	const getCardStyle = useCallback((item: (typeof carouselItems)[0]) => {
		return {
			"--card-outline-color":
				item.color || "var(--mantine-primary-color-filled)",
		};
	}, []);

	const hasText = useCallback((item: (typeof carouselItems)[0]) => {
		return item.label || item.description;
	}, []);

	return (
		<Carousel
			withIndicators={withIndicators}
			type="container"
			height={height}
			slideSize={slideSize}
			slideGap={slideGap}
			nextControlIcon={<Icon type={IconTypeEnum.ChevronRight} />}
			previousControlIcon={<Icon type={IconTypeEnum.ChevronLeft} />}
			loop
			align="start"
			classNames={{
				indicators: classes.indicators,
				indicator: classes.indicator,
			}}
		>
			{carouselItems.map((item) => (
				<Carousel.Slide key={item.value}>
					<Box
						p={"3px"} /* 1px for border + 2px for outline */
						h="100%"
					>
						<Card
							className={`${classes.card} ${disabled ? classes.cardDisabled : ""} ${value === item.value ? classes.cardSelected : ""}`}
							onClick={() =>
								handleCardClick(item.value, disabled)
							}
							style={getCardStyle(item)}
						>
							{item.imageUrl && (
								<div
									className={`${classes.imageContainer} ${hasText(item) ? classes.imageContainerWithText : ""}`}
								>
									<Image
										src={item.imageUrl}
										className={classes.image}
										fit={imageFit}
										alt={item.label || item.value}
										fallbackSrc="/not-found.svg"
									/>
								</div>
							)}

							{hasText(item) && (
								<div>
									<Text size="md">{item.label}</Text>
									{item.description && (
										<Text c="dimmed" size="sm">
											{item.description}
										</Text>
									)}
								</div>
							)}
						</Card>
					</Box>
				</Carousel.Slide>
			))}
		</Carousel>
	);
}
