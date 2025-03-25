import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import {
	Group,
	Image,
	MantineThemeComponent,
	Select,
	SelectProps,
	Text,
	useProps,
} from "@mantine/core";
import React from "react";
import {
	SelectComponentProps,
	SelectGroupStyleProps,
	SelectImageStyleProps,
	SelectTextStyleProps,
	SelectTextWeightedStyleProps,
} from "./SelectComponent";

interface StyleProps {
	imageProps: SelectImageStyleProps;
	groupProps: SelectGroupStyleProps;
	labelProps: SelectTextWeightedStyleProps;
	descriptionProps: SelectTextStyleProps;
}

export const defaultStyleProps: Partial<StyleProps> = {
	imageProps: {
		fit: "contain",
		h: "auto",
		w: "100px",
		fallbackSrc: "/not-found.svg",
	},
	groupProps: {wrap: "nowrap"},
	labelProps: {size: "sm", fontWeight: "medium"},
	descriptionProps: {size: "sm", c: "dimmed"},
};

type SelectImageDropDownComponentThemePropsType = Partial<StyleProps>;

export function SelectImageDropDownComponentThemeProps(
	props: SelectImageDropDownComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Custom data type for select options with image and description
 */
interface CustomSelectItem {
	value: string;
	label: string;
	description?: string;
	imageUrl?: string;
}

/**
 * Functional dropdown select component that can display images and descriptions.
 *
 * @see https://mantine.dev/combobox/?e=SelectOptionComponent
 */
export default function SelectImageDropDownComponent(
	props: SelectComponentProps & SelectImageDropDownComponentThemePropsType,
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
	const {groupProps, imageProps, labelProps, descriptionProps} = useProps(
		"SelectImageDropDownComponent",
		defaultStyleProps,
		styleProps,
	);

	// Transform items array into the format expected by Select component
	const selectData = items.map((item) => {
		const data = itemData?.[item];

		return {
			value: item,
			label: data?.displayname || item,
			description: data?.description,
			imageUrl: data?.imageUrl,
		};
	});

	// Custom render function for options
	const renderOption: SelectProps["renderOption"] = ({option}) => {
		// Cast option to our custom type
		const customOption = option as CustomSelectItem;

		return (
			<Group {...groupProps} {...settings?.groupProps}>
				{customOption.imageUrl && (
					<Image
						src={customOption.imageUrl}
						alt={customOption.label}
						{...imageProps}
						{...settings?.imageProps}
					/>
				)}
				<div style={{flex: 1}}>
					<TextWeighted {...labelProps} {...settings?.labelProps}>
						{customOption.label}
					</TextWeighted>
					{customOption.description && (
						<Text
							{...descriptionProps}
							{...settings?.descriptionProps}
						>
							{customOption.description}
						</Text>
					)}
				</div>
			</Group>
		);
	};

	return (
		<Select
			value={value}
			onChange={onChange}
			data={selectData}
			disabled={disabled}
			renderOption={renderOption}
			allowDeselect={false}
		/>
	);
}
