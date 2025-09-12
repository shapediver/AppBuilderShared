import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
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
import Icon from "~/shared/components/ui/Icon";
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
	searchable: boolean;
	limit: number;
	height: string;
	bottomSection: React.ReactNode;
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
	bottomSection: <></>,
	useLocalSearch: true,
	onSearch: () => {},
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
		searchable,
		height,
		limit,
		bottomSection,
		useLocalSearch,
		onSearch,
	} = useProps(
		"SelectFullWidthCardsComponent",
		defaultStyleProps,
		styleProps,
	);

	const [search, setSearch] = useState("");
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

	const renderSearchInput = () => {
		if (!searchable) return null;

		return (
			<TextInput
				value={search}
				onChange={(e) => {
					const term = e.currentTarget.value;
					setSearch(term);
					if (onSearch) {
						onSearch(term);
					}
				}}
				placeholder="Search"
				leftSection={<Icon iconType="search" size="1rem" />}
				disabled={disabled}
				aria-label="Search options"
			/>
		);
	};

	// Merge styles for container; enforce fixed height with internal scroll if provided
	const containerStyle = height
		? {
				...(settings?.stackProps?.style as any),
				height,
				overflowY: "auto",
			}
		: {
				...(settings?.stackProps?.style as any),
			};

	const filteredCards = useMemo(() => {
		let out = cardData;
		const isSearchable = searchable && search.trim();
		if (isSearchable) {
			const q = search.toLowerCase();
			if (useLocalSearch) {
				out = cardData.filter(
					(c) =>
						c.value.toLowerCase().includes(q) ||
						(c.label || "").toLowerCase().includes(q) ||
						(c.description || "").toLowerCase().includes(q),
				);
			}
		}
		return isSearchable && useLocalSearch && limit
			? out.slice(0, limit)
			: out;
	}, [cardData, searchable, search, limit, useLocalSearch]);

	const renderCards = () => {
		return filteredCards.map((card) => (
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
		));
	};

	return (
		<Stack
			{...stackProps}
			style={{...(stackProps?.style || {}), ...containerStyle}}
		>
			{renderSearchInput()}
			{renderCards()}
			{bottomSection}
		</Stack>
	);
}
