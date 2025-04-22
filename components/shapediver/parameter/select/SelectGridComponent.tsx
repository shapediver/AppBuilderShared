import {
	MantineThemeComponent,
	SimpleGrid,
	SimpleGridProps,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo} from "react";
import ButtonImageCard from "./ButtonImageCard";
import {
	SelectCardStyleProps,
	SelectComponentProps,
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
}

export const defaultStyleProps: Partial<StyleProps> = {
	gridProps: {
		cols: 2,
		spacing: "xs",
	},
	cardProps: {},
	imageProps: {
		fit: "cover",
		fallbackSrc: "not-found.svg",
	},
	stackProps: {gap: "xs"},
	labelProps: {size: "sm", fontWeight: "medium"},
	descriptionProps: {size: "sm", c: "dimmed"},
	showLabel: true,
};

type SelectGridComponentThemePropsType = Partial<StyleProps>;

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
	} = useProps("SelectGridComponent", defaultStyleProps, styleProps);

	const showLabel = settings?.showLabel ?? _showLabel;

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

	// Handle card selection
	const handleCardClick = useCallback(
		(itemValue: string, disabled: boolean | undefined) => {
			if (!disabled) {
				onChange(itemValue);
			}
		},
		[onChange],
	);

	const cardStyleProps = {
		cardProps,
		imageProps,
		stackProps,
		labelProps,
		descriptionProps,
	};

	return (
		<SimpleGrid
			cols={gridProps?.cols}
			spacing={gridProps?.spacing}
			{...settings?.gridProps}
		>
			{gridItems.map((item) => (
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
}
