import {Card, Group, Image, Stack, Text} from "@mantine/core";
import React from "react";
import {SelectComponentProps} from "./SelectComponent";
import classes from "./SelectFullWidthCards.module.css";

/**
 * Functional component that displays selectable full-width cards with images and descriptions.
 * Each card is displayed on a separate line, and the selected card is highlighted with a thicker border.
 */
export default function SelectFullWidthCards(props: SelectComponentProps) {
	const {value, onChange, items, disabled, itemData} = props;

	// Transform items array into the format expected by the component
	const cardData = items.map((item) => {
		const data = itemData?.[item];
		return {
			value: item,
			label: data?.displayname || item,
			description: data?.description,
			imageUrl: data?.imageUrl,
			width: data?.width || "100px",
			color: data?.color,
		};
	});

	// Handle card selection
	const handleCardClick = (cardValue: string) => {
		if (!disabled) {
			onChange(cardValue);
		}
	};

	return (
		<Stack>
			{cardData.map((card) => (
				<Card
					key={card.value}
					shadow="none"
					radius="md"
					className={`${classes.card} ${disabled ? classes.cardDisabled : ""}`}
					withBorder
					onClick={() => handleCardClick(card.value)}
					style={
						value === card.value
							? {
									borderColor: card.color || "var(--mantine-primary-color-filled)",
									borderWidth: "3px"
								}
							: undefined
					}
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
								<Text size="xs" color="dimmed">
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
