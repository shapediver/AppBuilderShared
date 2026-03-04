import {Icon} from "@AppBuilderLib/shared/ui/icon";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import {
	Card,
	Group,
	Image,
	MantineThemeComponent,
	Stack,
	Text,
	TextInput,
	UnstyledButton,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo, useState} from "react";
import {useCustomHeight} from "@AppBuilderLib/entities/parameter/model/useCustomHeight";
import {parameterMultiSelect} from "~/shared/utils/parameters/parameterMultiSelect";
import {UniversalMultiSelectComponentProps} from "../multiselect/MultiSelectComponent";
import {
	SelectCardStyleProps,
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
	searchable: boolean;
	limit: number;
	height: string;
	bottomSection: React.ReactNode;
	topSection: React.ReactNode;
	useLocalSearch: boolean;
	onSearch: (search: string) => void;
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
	searchable: false,
};

export type SelectFullWidthCardsComponentThemePropsType = Partial<StyleProps>;

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
	props: UniversalMultiSelectComponentProps &
		SelectFullWidthCardsComponentThemePropsType,
) {
	const {
		value,
		onChange,
		items,
		disabled,
		itemData,
		settings,
		multiselect,
		bottomSection = <></>,
		topSection = <></>,
		onSearch,
		...styleProps
	} = props;

	const {handleClick, isSelected} = parameterMultiSelect(
		value,
		onChange,
		multiselect,
	);

	// style properties
	const {
		cardProps,
		groupProps,
		imageProps,
		stackProps,
		labelProps,
		descriptionProps,
		searchable,
		height,
		limit,
	} = useProps(
		"SelectFullWidthCardsComponent",
		defaultStyleProps,
		styleProps,
	);

	const [searchTerm, setSearchTerm] = useState("");
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

	const getCardStyle = useCallback((card: (typeof cardData)[0]) => {
		return {
			"--card-selected-color":
				card.color || "var(--mantine-primary-color-filled)",
		};
	}, []);

	const renderSearchInput = () => {
		if (!searchable) return null;

		return (
			<TextInput
				value={searchTerm}
				onChange={(e) => {
					const term = e.currentTarget.value;
					setSearchTerm(term);
					onSearch?.(term);
				}}
				placeholder="Search"
				leftSection={<Icon iconType="search" size="1rem" />}
				aria-label="Search options"
			/>
		);
	};

	const filteredCards = useMemo(() => {
		if (!searchable || !searchTerm.trim() || onSearch) return cardData;
		const q = searchTerm.toLowerCase();
		const filteredItems = cardData.filter(
			(c) =>
				c.value.toLowerCase().includes(q) ||
				(c.label || "").toLowerCase().includes(q) ||
				(c.description || "").toLowerCase().includes(q),
		);
		return limit ? filteredItems.slice(0, limit) : filteredItems;
	}, [cardData, searchable, searchTerm, limit, onSearch]);

	// Use custom height hook to handle height-related styling and scrollable content
	const cardsContent = (
		<>
			{filteredCards.map((card) => (
				<UnstyledButton
					key={card.value}
					disabled={disabled}
					onClick={() => !disabled && handleClick(card.value)}
					aria-pressed={isSelected(card.value)}
				>
					<Card
						className={`${classes.card} ${disabled ? classes.cardDisabled : ""} ${isSelected(card.value) ? classes.cardSelected : ""}`}
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
			{bottomSection}
		</>
	);

	const {containerStyle: heightContainerStyle, element: heightWrapper} =
		useCustomHeight(cardsContent, height);

	return (
		<Stack
			{...stackProps}
			style={{
				...(stackProps?.style || {}),
				...(settings?.stackProps?.style as any),
				...heightContainerStyle,
			}}
		>
			{renderSearchInput()}
			{topSection}
			{heightWrapper}
		</Stack>
	);
}
