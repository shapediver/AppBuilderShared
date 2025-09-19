import {
	MantineThemeComponent,
	SimpleGrid,
	SimpleGridProps,
	Stack,
	TextInput,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo, useState} from "react";
import Icon from "~/shared/components/ui/Icon";
import ButtonImageCard from "./ButtonImageCard";
import {
	SelectCardStyleProps,
	SelectComponentProps,
	SelectImageStyleProps,
	SelectStackStyleProps,
	SelectTextStyleProps,
	SelectTextWeightedStyleProps,
} from "./SelectComponent";
import classes from "./SelectGridComponent.module.css";

interface StyleProps {
	gridProps: SimpleGridProps;
	cardProps: SelectCardStyleProps;
	imageProps: SelectImageStyleProps;
	stackProps: SelectStackStyleProps;
	labelProps: SelectTextWeightedStyleProps;
	descriptionProps: SelectTextStyleProps;
	showLabel: boolean;
	searchable: boolean;
	limit: number;
	height: string;
	bottomSection: React.ReactNode;
	topSection: React.ReactNode;
	onSearch: (search: string) => void;
}

export const defaultStyleProps: Partial<StyleProps> = {
	gridProps: {
		cols: 2,
		spacing: "xs",
	},
	cardProps: {},
	imageProps: {
		fit: "contain",
		fallbackSrc: "not-found.svg",
	},
	stackProps: {gap: "xs"},
	labelProps: {size: "sm", fontWeight: "medium"},
	descriptionProps: {size: "sm", c: "dimmed"},
	showLabel: true,
	searchable: false,
};

export type SelectGridComponentThemePropsType = Partial<StyleProps>;

export function SelectGridComponentThemeProps(
	props: SelectGridComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that displays selectable items in a grid layout with images.
 * Images can be displayed with or without title/description.
 * The grid is responsive based on container width.
 */
export default function SelectGridComponent(
	props: SelectComponentProps & SelectGridComponentThemePropsType,
) {
	const {
		value,
		onChange,
		items,
		disabled,
		itemData,
		settings,
		bottomSection = <></>,
		topSection = <></>,
		onSearch,
		...styleProps
	} = props;

	// style properties
	const {
		gridProps,
		cardProps,
		imageProps,
		stackProps,
		labelProps,
		descriptionProps,
		showLabel: _showLabel,
		searchable,
		height,
		limit,
	} = useProps("SelectGridComponent", defaultStyleProps, styleProps);

	const showLabel = settings?.showLabel ?? _showLabel;
	const [searchTerm, setSearchTerm] = useState("");

	// Transform items array into the format expected by the component
	const gridItems = useMemo(
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

	const filteredItems = useMemo(() => {
		if (!searchable || !searchTerm.trim() || onSearch) return gridItems;
		const q = searchTerm.toLowerCase();
		const filteredItems = gridItems.filter(
			(c) =>
				c.value.toLowerCase().includes(q) ||
				(c.label || "").toLowerCase().includes(q) ||
				(c.description || "").toLowerCase().includes(q),
		);
		return limit ? filteredItems.slice(0, limit) : filteredItems;
	}, [gridItems, searchable, searchTerm, limit, onSearch]);

	// Handle card selection
	const handleCardClick = useCallback(
		(itemValue: string, disabled: boolean | undefined) => {
			if (!disabled) {
				onChange(itemValue);
			}
		},
		[onChange],
	);

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

	const cardStyleProps = {
		cardProps,
		imageProps,
		stackProps,
		labelProps,
		descriptionProps,
	};

	// Merge styles for container; enforce fixed height with internal scroll if provided
	const containerStyle = height
		? {
				...(settings?.stackProps?.style as any),
				height,
				display: "flex",
				flexDirection: "column",
			}
		: {
				...(settings?.stackProps?.style as any),
			};

	const renderCards = () => {
		const cards = (
			<SimpleGrid
				cols={gridProps?.cols}
				spacing={gridProps?.spacing}
				{...settings?.gridProps}
			>
				{filteredItems.map((item) => (
					<ButtonImageCard
						key={item.value}
						item={item}
						selected={value === item.value}
						disabled={disabled}
						onClick={handleCardClick}
						showLabel={showLabel}
						settings={settings}
						{...cardStyleProps}
					/>
				))}
			</SimpleGrid>
		);

		if (height) {
			return (
				<div className={classes.scrollableCards}>
					{cards}
					{bottomSection}
				</div>
			);
		}
		return (
			<>
				{cards}
				{bottomSection}
			</>
		);
	};

	return (
		<Stack
			{...stackProps}
			style={{...(stackProps?.style || {}), ...containerStyle}}
		>
			{renderSearchInput()}
			{topSection}
			{renderCards()}
		</Stack>
	);
}
