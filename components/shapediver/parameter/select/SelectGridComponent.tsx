import {
	MantineThemeComponent,
	SimpleGrid,
	SimpleGridProps,
	Stack,
	TextInput,
	useProps,
} from "@mantine/core";
import React, {useMemo, useState} from "react";
import {useCustomHeight} from "~/shared/hooks/shapediver/parameters/useCustomHeight";
import {Icon} from "~/shared/shared/ui/Icon";
import {parameterMultiSelect} from "~/shared/utils/parameters/parameterMultiSelect";
import {UniversalMultiSelectComponentProps} from "../multiselect/MultiSelectComponent";
import ButtonImageCard from "./ButtonImageCard";
import {
	SelectCardStyleProps,
	SelectImageStyleProps,
	SelectStackStyleProps,
	SelectTextStyleProps,
	SelectTextWeightedStyleProps,
} from "./SelectComponent";

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
	props: UniversalMultiSelectComponentProps &
		SelectGridComponentThemePropsType,
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
	const handleCardClick = (itemValue: string, disabled?: boolean) => {
		if (!disabled) {
			handleClick(itemValue);
		}
	};

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

	// Use custom height hook to handle height-related styling and scrollable content
	const cardsContent = (
		<>
			<SimpleGrid
				cols={gridProps?.cols}
				spacing={gridProps?.spacing}
				{...settings?.gridProps}
			>
				{filteredItems.map((item) => (
					<ButtonImageCard
						key={item.value}
						item={item}
						selected={isSelected(item.value)}
						disabled={disabled}
						onClick={handleCardClick}
						showLabel={showLabel}
						settings={settings}
						{...cardStyleProps}
					/>
				))}
			</SimpleGrid>
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
