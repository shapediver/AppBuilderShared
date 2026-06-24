import {resolveFilterColor} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/resolveFilterColor";
import {
	Checkbox,
	ColorSwatch,
	Group,
	Text,
	useMantineTheme,
	type CheckboxProps,
	type ColorSwatchProps,
	type GroupProps,
	type TextProps,
} from "@mantine/core";
import classes from "./FilterableDatabaseFilters.module.css";

export interface FilterableDatabaseFilterOptionStyleProps {
	checkboxProps?: CheckboxProps;
	groupProps?: Omit<GroupProps, "children">;
	labelTextProps?: Omit<TextProps, "children">;
	colorSwatchProps?: Omit<ColorSwatchProps, "color">;
}

export interface FilterableDatabaseFilterOptionProps extends FilterableDatabaseFilterOptionStyleProps {
	filterIndex: number;
	value: string;
	label: string;
	checked: boolean;
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
		groupType,
		color,
		onToggle,
		checkboxProps,
		groupProps,
		labelTextProps,
		colorSwatchProps,
	} = props;

	const theme = useMantineTheme();
	const swatchColor =
		groupType === "color"
			? resolveFilterColor(color ?? value, theme)
			: undefined;

	return (
		<div className={classes.filterOption}>
			<Checkbox
				checked={checked}
				onChange={() => onToggle(filterIndex, value)}
				label={
					<Group {...groupProps}>
						{swatchColor && (
							<ColorSwatch
								color={swatchColor}
								{...colorSwatchProps}
							/>
						)}
						<Text {...labelTextProps}>{label}</Text>
					</Group>
				}
				{...checkboxProps}
			/>
		</div>
	);
}
