import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {
	Card,
	Group,
	Image,
	MantineThemeComponent,
	Stack,
	Text,
	UnstyledButton,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo} from "react";
import {
	SelectCardStyleProps,
	SelectComponentProps,
	SelectGroupStyleProps,
	SelectImageStyleProps,
	SelectStackStyleProps,
	SelectTextStyleProps,
	SelectTextWeightedStyleProps,
} from "./SelectComponent";
import classes from "./SelectFullWidthCards.module.css";

interface StyleProps {
	cardProps: SelectCardStyleProps;
	groupProps: SelectGroupStyleProps;
	imageProps: SelectImageStyleProps;
	stackProps: SelectStackStyleProps;
	labelProps: SelectTextWeightedStyleProps;
	descriptionProps: SelectTextStyleProps;
}

export const defaultStyleProps: Partial<StyleProps> = {
	cardProps: {},
	groupProps: {wrap: "nowrap"},
	imageProps: {
		fit: "contain",
		h: "auto",
		w: "100px",
		fallbackSrc: "not-found.svg",
	},
	stackProps: {},
	labelProps: {size: "sm", fontWeight: "medium"},
	descriptionProps: {size: "xs", c: "dimmed"},
};

type SelectFullWidthCardsComponentThemePropsType = Partial<StyleProps>;

export function SelectFullWidthCardsComponentThemeProps(
	props: SelectFullWidthCardsComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that displays selectable full-width cards with images and descriptions.
 * Each card is displayed on a separate line, and the selected card is highlighted with a thicker border.
 * @see https://mantine.dev/core/stack/
 * @see https://mantine.dev/core/card/
 */
export default function SelectFullWidthCardsComponent(
	props: SelectComponentProps & SelectFullWidthCardsComponentThemePropsType,
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
		cardProps,
		groupProps,
		imageProps,
		stackProps,
		labelProps,
		descriptionProps,
	} = useProps(
		"SelectFullWidthCardsComponent",
		defaultStyleProps,
		styleProps,
	);

	// Transform items array into the format expected by the component
	const cardData = useMemo(
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

	// Handle card selection
	const handleCardClick = useCallback(
		(cardValue: string, disabled: boolean | undefined) => {
			if (!disabled) {
				onChange(cardValue);
			}
		},
		[onChange],
	);

	const getCardStyle = useCallback((card: (typeof cardData)[0]) => {
		return {
			"--card-selected-color":
				card.color || "var(--mantine-primary-color-filled)",
		};
	}, []);

	return (
		<Stack {...stackProps} {...settings?.stackProps}>
			{cardData.map((card) => (
				<UnstyledButton
					key={card.value}
					disabled={disabled}
					onClick={() => handleCardClick(card.value, disabled)}
					aria-pressed={value === card.value}
				>
					<Card
						className={`${classes.card} ${disabled ? classes.cardDisabled : ""} ${value === card.value ? classes.cardSelected : ""}`}
						style={getCardStyle(card)}
						{...cardProps}
						{...settings?.cardProps}
					>
						<Group {...groupProps} {...settings?.groupProps}>
							{card.imageUrl && (
								<TooltipWrapper label={card.tooltip}>
									<Image
										src={card.imageUrl}
										alt={card.label}
										{...imageProps}
										{...settings?.imageProps}
									/>
								</TooltipWrapper>
							)}
							<div style={{flex: 1}}>
								<TextWeighted
									{...labelProps}
									{...settings?.labelProps}
								>
									{card.label}
								</TextWeighted>
								{card.description && (
									<Text
										{...descriptionProps}
										{...settings?.descriptionProps}
									>
										{card.description}
									</Text>
								)}
							</div>
						</Group>
					</Card>
				</UnstyledButton>
			))}
		</Stack>
	);
}
