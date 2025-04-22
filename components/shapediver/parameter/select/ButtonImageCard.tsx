import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {Card, Image, Stack, Text, UnstyledButton} from "@mantine/core";
import React from "react";
import classes from "./ButtonImageCard.module.css";

export interface CardItem {
	value: string;
	label: string;
	description?: string;
	imageUrl?: string;
	tooltip?: string;
	color?: string;
}

export interface ButtonImageCardProps {
	item: CardItem;
	selected: boolean;
	disabled?: boolean;
	onClick: (value: string, disabled?: boolean) => void;
	showLabel?: boolean;
	settings?: Record<string, any>;
	[key: string]: any; // Allow any other props to be passed
}

export default function ButtonImageCard({
	item,
	selected,
	disabled,
	onClick,
	showLabel = true,
	settings = {},
	...rest
}: ButtonImageCardProps) {
	const {
		cardProps = {},
		imageProps = {},
		stackProps = {},
		labelProps = {},
		descriptionProps = {},
		...otherProps
	} = rest;

	const getCardStyle = () => {
		return {
			"--card-selected-color":
				item.color || "var(--mantine-primary-color-filled)",
		} as React.CSSProperties;
	};

	return (
		<UnstyledButton
			disabled={disabled}
			aria-pressed={selected}
			className={classes.unstyledButton}
			{...otherProps}
		>
			<Card
				className={`${classes.card} ${disabled ? classes.cardDisabled : ""} ${selected ? classes.cardSelected : ""}`}
				onClick={() => onClick(item.value, disabled)}
				style={getCardStyle()}
				{...cardProps}
				{...settings?.cardProps}
			>
				<Stack {...stackProps} {...settings?.stackProps}>
					{item.imageUrl && (
						<div
							className={`${classes.imageContainer} ${showLabel ? classes.imageContainerWithText : ""}`}
						>
							<TooltipWrapper label={item.tooltip}>
								<Image
									src={item.imageUrl}
									alt={item.label}
									className={classes.image}
									{...imageProps}
									{...settings?.imageProps}
								/>
							</TooltipWrapper>
						</div>
					)}
					{showLabel && (
						<>
							<TextWeighted
								{...labelProps}
								{...settings?.labelProps}
							>
								{item.label}
							</TextWeighted>
							{item.description && (
								<Text
									{...descriptionProps}
									{...settings?.descriptionProps}
								>
									{item.description}
								</Text>
							)}
						</>
					)}
				</Stack>
			</Card>
		</UnstyledButton>
	);
}
