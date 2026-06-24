import {resolveFilterColor} from "@AppBuilderLib/entities/parameter/lib/filterableDatabase/resolveFilterColor";
import {
	Checkbox,
	ColorSwatch,
	Group,
	Text,
	useMantineTheme,
	type CheckboxProps,
} from "@mantine/core";
import classes from "./FilterableDatabaseFilters.module.css";

export interface FilterableDatabaseFilterOptionStyleProps {
	checkboxProps?: CheckboxProps;
}

export interface FilterableDatabaseFilterOptionProps
	extends FilterableDatabaseFilterOptionStyleProps {
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
					<Group gap="xs" wrap="nowrap">
						{swatchColor && (
							<ColorSwatch color={swatchColor} size={16} />
						)}
						<Text size="sm">{label}</Text>
					</Group>
				}
				{...checkboxProps}
			/>
		</div>
	);
}
