import {Card, Group, Image, Stack, Text} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";
import classes from "./SelectFullWidthCards.module.css";

/**
 * Functional component that displays selectable full-width cards with images and descriptions.
 * Each card is displayed on a separate line, and the selected card is highlighted with a thicker border.
 * @see https://mantine.dev/core/stack/
 * @see https://mantine.dev/core/card/
 */
export default function SelectFullWidthCards(props: SelectComponentProps) {
	const {value, onChange, items, disabled, itemData, settings} = props;
	const width = settings?.width || "100px";

	// Transform items array into the format expected by the component
	const cardData = items.map((item) => {
		const data = itemData?.[item];

		return {
			value: item,
			label: data?.displayname || item,
			description: data?.description,
			imageUrl: data?.imageUrl,
			width: width,
			color: data?.color,
		};
	});

	// Handle card selection
	const handleCardClick = (cardValue: string) => {
		if (!disabled) {
			onChange(cardValue);
		}
	};

	const getCardStyle = (card: (typeof cardData)[0], isSelected: boolean) => {
		if (!isSelected) return {};

		return {
			"--card-outline-color":
				card.color || "var(--mantine-primary-color-filled)",
		};
	};

	return (
		<Stack>
			{cardData.map((card) => (
				<Card
					key={card.value}
					className={`${classes.card} ${disabled ? classes.cardDisabled : ""} ${value === card.value ? classes.cardSelected : ""}`}
					onClick={() => handleCardClick(card.value)}
					style={getCardStyle(card, value === card.value)}
				>
					<Group wrap="nowrap">
						{card.imageUrl && (
							<Image
								src={card.imageUrl}
								w={card.width}
								h="auto"
								fit="contain"
								alt={card.label}
								fallbackSrc="/not-found.svg"
							/>
						)}
						<div style={{flex: 1}}>
							<Text size="sm" fw={500}>
								{card.label}
							</Text>
							{card.description && (
								<Text size="xs" c="dimmed">
									{card.description}
								</Text>
							)}
						</div>
					</Group>
				</Card>
			))}
		</Stack>
	);
}
