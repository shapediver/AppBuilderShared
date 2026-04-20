import {useCustomHeight} from "../../model/useCustomHeight";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import {
	Checkbox,
	CheckboxProps,
	MantineThemeComponent,
	Stack,
	StackProps,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo} from "react";
import {MultiSelectComponentProps} from "./MultiSelectComponent";

interface StyleProps {
	stackProps?: Partial<StackProps>;
	checkboxProps?: Partial<CheckboxProps>;
	checkboxPropsSelectAll?: Partial<CheckboxProps>;
	labelSelectAll?: string;
	height?: string;
}

export const defaultStyleProps: Partial<StyleProps> = {
	stackProps: {
		gap: "xs",
	},
	checkboxProps: {
		ml: "md",
	},
	checkboxPropsSelectAll: {
		label: "Select all",
	},
	height: undefined,
};
type MultiSelectCheckboxesPropsType = Partial<StyleProps>;

export function MultiSelectCheckboxesProps(
	props: MultiSelectCheckboxesPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional checkbox multiselect component.
 * Shows checkboxes with a "Select all" option that has indeterminate state.
 */
export default function MultiSelectCheckboxesComponent(
	props: MultiSelectComponentProps & MultiSelectCheckboxesPropsType,
) {
	const {value, onChange, items, disabled, height, itemData, ...styleProps} =
		props;

	// style properties
	const {stackProps, checkboxProps, checkboxPropsSelectAll} = useProps(
		"MultiSelectCheckboxes",
		defaultStyleProps,
		styleProps,
	);

	// Calculate states for "Select all" checkbox
	const allChecked = useMemo(() => {
		return items.length > 0 && items.every((item) => value.includes(item));
	}, [items, value]);

	const indeterminate = useMemo(() => {
		return value.length > 0 && !allChecked;
	}, [value.length, allChecked]);

	// Handle "Select all" checkbox change
	const handleSelectAllChange = useCallback(() => {
		if (allChecked) {
			// Unselect all
			onChange([]);
		} else {
			// Select all
			onChange([...items]);
		}
	}, [allChecked, items, onChange]);

	// Handle individual checkbox change
	const handleItemChange = useCallback(
		(item: string, checked: boolean) => {
			if (checked) {
				// Add item to selection
				onChange([...value, item]);
			} else {
				// Remove item from selection
				onChange(value.filter((v) => v !== item));
			}
		},
		[value, onChange],
	);

	const checkboxElements = useMemo(() => {
		return items.map((item) => {
			const data = itemData?.[item];
			const displayName = data?.displayname || item;
			const tooltip = data?.tooltip;
			const checkbox = (
				<Checkbox
					{...checkboxProps}
					key={item}
					label={displayName}
					checked={value.includes(item)}
					onChange={(event) =>
						handleItemChange(item, event.currentTarget.checked)
					}
					disabled={disabled}
				/>
			);

			return tooltip ? (
				<TooltipWrapper key={item} label={tooltip}>
					{checkbox}
				</TooltipWrapper>
			) : (
				checkbox
			);
		});
	}, [items, value, disabled, checkboxProps]);

	// Custom height hook
	const {containerStyle: heightContainerStyle, element: heightWrapper} =
		useCustomHeight(checkboxElements, height);

	return (
		<Stack {...stackProps} style={heightContainerStyle}>
			<Checkbox
				{...checkboxPropsSelectAll}
				checked={allChecked}
				indeterminate={indeterminate}
				onChange={handleSelectAllChange}
				disabled={disabled}
			/>
			{heightWrapper}
		</Stack>
	);
}
