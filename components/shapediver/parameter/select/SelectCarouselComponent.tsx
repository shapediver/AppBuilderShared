import {Carousel} from "@mantine/carousel";
import "@mantine/carousel/styles.css";
import {Card, Image, Text, ThemeIcon} from "@mantine/core";
import {IconChevronLeft, IconChevronRight} from "@tabler/icons-react";
import React, {useCallback, useMemo} from "react";
import classes from "./SelectCarouselComponent.module.css";
import {SelectComponentProps} from "./SelectComponent";

export interface SelectCarouselSettings {
	/** Optional image fit property (cover or fill). */
	imageFit?: "cover" | "fill";
	/** Whether to show carousel indicators. */
	withIndicators?: boolean;
}

/**
 * Functional component that displays selectable items in a carousel with images.
 * Images can be displayed with or without title/description.
 * The carousel is responsive based on container width.
 */
export default function SelectCarouselComponent(props: SelectComponentProps) {
	const {value, onChange, items, disabled, itemData, settings} = props;
	const imageFit = settings?.imageFit || "cover";
	const withIndicators = settings?.withIndicators !== false;

	// Transform items array into the format expected by the component
	const carouselItems = useMemo(
		() =>
			items.map((item) => {
				const data = itemData?.[item];

				return {
					value: item,
					label: data?.displayname,
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
			slideSize={{base: "100%", "200px": "50%", "500px": "33.333333%"}}
			slideGap={{base: 0, "200px": "md"}}
			nextControlIcon={
				<ThemeIcon radius="xl">
					<IconChevronRight size={16} />
				</ThemeIcon>
			}
			previousControlIcon={
				<ThemeIcon radius="xl">
					<IconChevronLeft size={16} />
				</ThemeIcon>
			}
			loop
			align="start"
			classNames={{
				indicators: classes.indicators,
				indicator: classes.indicator,
			}}
		>
			{carouselItems.map((item) => (
				<Carousel.Slide key={item.value}>
					<section className={classes.cardWrapper}>
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
									{item.label &&
										item.label !== item.value && (
											<Text>{item.label}</Text>
										)}
									{item.description && (
										<Text c="dimmed" size="sm">
											{item.description}
										</Text>
									)}
								</div>
							)}
						</Card>
					</section>
				</Carousel.Slide>
			))}
		</Carousel>
	);
}
