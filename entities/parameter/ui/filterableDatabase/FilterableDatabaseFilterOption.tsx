import {resolveFilterColor} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/resolveFilterColor";
import {
	Checkbox,
	ColorSwatch,
	Group,
	Radio,
	Text,
	useMantineTheme,
	type CheckboxProps,
	type ColorSwatchProps,
	type GroupProps,
	type RadioProps,
	type TextProps,
} from "@mantine/core";
import {useCallback, type MouseEvent} from "react";
import classes from "./FilterableDatabaseFilters.module.css";
export interface FilterableDatabaseFilterOptionStyleProps {
	checkboxProps?: CheckboxProps;
	radioProps?: RadioProps;
	groupProps?: Omit<GroupProps, "children">;
	labelTextProps?: Omit<TextProps, "children">;
	colorSwatchProps?: Omit<ColorSwatchProps, "color">;
}

export interface FilterableDatabaseFilterOptionProps extends FilterableDatabaseFilterOptionStyleProps {
	filterIndex: number;
	value: string;
	label: string;
	checked: boolean;
	multiple: boolean;
	groupType?: "color";
	color?: string;
	onToggle: (filterIndex: number, value: string) => void;
}

export function FilterableDatabaseFilterOption(
	props: FilterableDatabaseFilterOptionProps,
) {
	const {
		filterIndex,
		value,
		label,
		checked,
		multiple,
		groupType,
		color,
		onToggle,
		checkboxProps,
		radioProps,
		groupProps,
		labelTextProps,
		colorSwatchProps,
	} = props;

	const theme = useMantineTheme();
	const swatchColor =
		groupType === "color"
			? resolveFilterColor(color ?? value, theme)
			: undefined;

	const keepComboboxOpen = useCallback((event: MouseEvent) => {
		event.preventDefault();
	}, []);

	const optionLabel = (
		<Group {...groupProps}>
			{swatchColor && (
				<ColorSwatch color={swatchColor} {...colorSwatchProps} />
			)}
			<Text {...labelTextProps}>{label}</Text>
		</Group>
	);

	return (
		<div className={classes.filterOption} onMouseDown={keepComboboxOpen}>
			{multiple ? (
				<Checkbox
					checked={checked}
					onChange={() => onToggle(filterIndex, value)}
					label={optionLabel}
					{...checkboxProps}
				/>
			) : (
				<Radio value={value} label={optionLabel} {...radioProps} />
			)}
		</div>
	);
}
