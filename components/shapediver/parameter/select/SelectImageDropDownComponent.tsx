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
					color: data?.color,
				};
			}),
		[items, itemData],
	);

	const getInputStyle = useCallback((card?: (typeof selectData)[0]) => {
		if (!card) return {};

		return {
			"--card-selected-color":
				card.color || "var(--mantine-primary-color-filled)",
		} as React.CSSProperties;
	}, []);

	const selectedOptionIndex = useMemo(() => {
		if (!value) return -1;
		return items.findIndex((item) => item === value);
	}, [items, value]);

	const combobox = useCombobox({
		onDropdownClose: () => combobox.resetSelectedOption(),
		scrollBehavior: "smooth",
		onDropdownOpen: () => {
			// Scroll to the selected option when the dropdown is opened
			if (selectedOptionIndex !== -1) {
				setTimeout(() => {
					const options = document.querySelectorAll(
						`.${classes.comboboxDropdown} [role="option"]`,
					);
					if (options && options.length > selectedOptionIndex) {
						const option = options[
							selectedOptionIndex
						] as HTMLElement;
						if (option) {
							option.scrollIntoView({
								behavior: "smooth",
								block: "center",
							});
						}
					}
				}, 50);
			}
		},
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
			selectData.map((option, index) => (
				<Combobox.Option
					className={`${classes.input} ${selectedOption?.value === option.value ? classes.inputSelected : ""}`}
					style={getInputStyle(selectedOption)}
					value={option.value}
					key={index}
				>
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
			getInputStyle,
			selectedOption,
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
				withinPortal={false}
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
						className={`${classes.input}`}
						style={getInputStyle(selectedOption)}
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
			getInputStyle,
		],
	);

	return inputContainer ? inputContainer(InputComponent) : InputComponent;
}
