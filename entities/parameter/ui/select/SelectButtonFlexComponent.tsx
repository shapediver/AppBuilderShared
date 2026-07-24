import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {Button, Flex, MantineThemeComponent, useProps} from "@mantine/core";
import {parameterMultiSelect} from "../../lib/parameterMultiSelect";
import {UniversalMultiSelectComponentProps} from "../multiselect/MultiSelectComponent";
import type {
	SelectButtonStyleProps,
	SelectFlexStyleProps,
} from "./SelectComponent";

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.SelectButtonFlexComponent.defaultProps
 * @displayName SelectButtonFlexComponent
 */
export interface SelectButtonFlexComponentStyleProps {
	flexProps: SelectFlexStyleProps;
	buttonProps: Omit<
		SelectButtonStyleProps,
		"color" | "disabled" | "onClick" | "variant"
	>;
}

export type SelectButtonFlexComponentProps =
	UniversalMultiSelectComponentProps &
		Partial<SelectButtonFlexComponentStyleProps>;

export const defaultStyleProps = {
	flexProps: {gap: "xs", wrap: "wrap"},
	buttonProps: {},
} satisfies Partial<SelectButtonFlexComponentStyleProps>;

export type SelectButtonFlexComponentThemePropsType =
	Partial<SelectButtonFlexComponentStyleProps>;

export function SelectButtonFlexComponentThemeProps(
	props: SelectButtonFlexComponentThemePropsType,
): MantineThemeComponent {
	return {defaultProps: props};
}

/**
 * Functional button flex select component.
 * Makes use of buttons aligned using a flex container to select an item.
 * @see https://mantine.dev/core/button
 * @see https://mantine.dev/core/flex/
 */
export default function SelectButtonFlexComponent(
	props: SelectButtonFlexComponentProps,
) {
	const {
		value,
		onChange,
		items,
		disabled,
		itemData,
		multiselect,
		flexProps: flexPropsProp,
		buttonProps: buttonPropsProp,
	} = props;
	const {handleClick, isSelected} = parameterMultiSelect(
		value,
		onChange,
		multiselect,
	);
	const {flexProps, buttonProps} = useProps(
		"SelectButtonFlexComponent",
		defaultStyleProps,
		{flexProps: flexPropsProp, buttonProps: buttonPropsProp},
	);

	return (
		<Flex {...flexProps}>
			{items.map((item) => {
				const data = itemData?.[item];
				const displayName = data?.displayname || item;
				const tooltip = data?.tooltip;

				const button = (
					<Button
						{...buttonProps}
						key={item}
						variant={isSelected(item) ? "filled" : "default"}
						color={data?.color}
						onClick={() => handleClick(item)}
						disabled={disabled}
					>
						{displayName}
					</Button>
				);
				return tooltip ? (
					<TooltipWrapper key={item} label={tooltip}>
						{button}
					</TooltipWrapper>
				) : (
					button
				);
			})}
		</Flex>
	);
}
