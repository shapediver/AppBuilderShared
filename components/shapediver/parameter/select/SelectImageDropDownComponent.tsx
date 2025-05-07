import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {
	Combobox,
	Group,
	Image,
	InputBase,
	MantineThemeComponent,
	Text,
	useCombobox,
	useProps,
} from "@mantine/core";
import React, {useCallback, useMemo} from "react";
import {
	SelectComponentProps,
	SelectGroupStyleProps,
	SelectImageStyleProps,
	SelectTextStyleProps,
	SelectTextWeightedStyleProps,
} from "./SelectComponent";
import classes from "./SelectImageDropDownComponent.module.css";

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
		fallbackSrc: "not-found.svg",
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

interface OptionType {
	value: string;
	label: string;
	description?: string;
	imageUrl?: string;
	tooltip?: string;
}

interface ComboboxOptionProps {
	option: OptionType;
	groupProps?: SelectGroupStyleProps;
	imageProps?: SelectImageStyleProps;
	labelProps?: SelectTextWeightedStyleProps;
	descriptionProps?: SelectTextStyleProps;
	settings?: any;
}

// Option component extracted for better performance
const ComboboxOption = React.memo(function ComboboxOption({
	option,
	groupProps,
	imageProps,
	labelProps,
	descriptionProps,
	settings,
}: ComboboxOptionProps) {
	return (
		<Group {...groupProps} {...settings?.groupProps}>
			{option.imageUrl && (
				<TooltipWrapper label={option.label}>
					<Image
						src={option.imageUrl}
						alt={option.label}
						{...imageProps}
						{...settings?.imageProps}
					/>
				</TooltipWrapper>
			)}
			<div style={{flex: 1}}>
				<TextWeighted {...labelProps} {...settings?.labelProps}>
					{option.label}
				</TextWeighted>
				{option.description && (
					<Text {...descriptionProps} {...settings?.descriptionProps}>
						{option.description}
					</Text>
				)}
			</div>
		</Group>
	);
});

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
		inputContainer,
		...styleProps
	} = props;

	// style properties
	const {groupProps, imageProps, labelProps, descriptionProps} = useProps(
		"SelectImageDropDownComponent",
		defaultStyleProps,
		styleProps,
	);

	// Transform items array into the format expected by Combobox - memoize to prevent unnecessary calculations
	const selectData = useMemo(
		() =>
			items.map((item) => {
				const data = itemData?.[item];
				return {
					value: item,
					label: data?.displayname || item,
					description: data?.description,
					imageUrl: data?.imageUrl,
					tooltip: data?.tooltip,
				};
			}),
		[items, itemData],
	);

	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
	});

	const selectedOption = useMemo(
		() => selectData.find((item) => item.value === value),
		[selectData, value],
	);

	// Handle option selection and close dropdown
	const handleOptionSelect = useCallback(
		(val: string) => {
			onChange(val);
			combobox.closeDropdown();
		},
		[onChange, combobox],
	);

	// Memoize dropdown toggle to prevent recreation on each render
	const handleDropdownToggle = useCallback(() => {
		combobox.toggleDropdown();
	}, [combobox]);

	// Custom option components - memoize to prevent unnecessary rerenders
	const comboboxOptions = useMemo(
		() =>
			selectData.map((option) => (
				<Combobox.Option value={option.value} key={option.value}>
					<ComboboxOption
						option={option}
						groupProps={groupProps}
						imageProps={imageProps}
						labelProps={labelProps}
						descriptionProps={descriptionProps}
						settings={settings}
					/>
				</Combobox.Option>
			)),
		[
			selectData,
			groupProps,
			imageProps,
			labelProps,
			descriptionProps,
			settings,
		],
	);

	// Memoize the dropdown content to prevent re-creation on each render
	const dropdownContent = useMemo(
		() => (
			<Combobox.Dropdown className={`${classes.comboboxDropdown}`}>
				<Combobox.Options>{comboboxOptions}</Combobox.Options>
			</Combobox.Dropdown>
		),
		[comboboxOptions],
	);

	const InputComponent = useMemo(
		() => (
			<Combobox
				store={combobox}
				onOptionSubmit={handleOptionSelect}
				disabled={disabled}
			>
				<Combobox.Target>
					<InputBase
						component="button"
						type="button"
						pointer
						disabled={disabled}
						rightSection={<Combobox.Chevron />}
						onClick={handleDropdownToggle}
						multiline
					>
						{value !== null && selectedOption ? (
							<ComboboxOption
								option={selectedOption}
								groupProps={groupProps}
								imageProps={imageProps}
								labelProps={labelProps}
								descriptionProps={descriptionProps}
								settings={settings}
							/>
						) : (
							<TextWeighted
								{...labelProps}
								{...settings?.labelProps}
							>
								Select an option
							</TextWeighted>
						)}
					</InputBase>
				</Combobox.Target>

				{dropdownContent}
			</Combobox>
		),
		[
			combobox,
			handleOptionSelect,
			disabled,
			handleDropdownToggle,
			value,
			selectedOption,
			groupProps,
			imageProps,
			labelProps,
			descriptionProps,
			settings,
			dropdownContent,
		],
	);

	return inputContainer ? inputContainer(InputComponent) : InputComponent;
}
