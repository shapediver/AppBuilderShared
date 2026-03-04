import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import ParameterLabelComponent from "@AppBuilderLib/entities/parameter/ui/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderLib/entities/parameter/ui/ParameterWrapperComponent";
import {useFocus} from "@AppBuilderLib/entities/parameter/model/useFocus";
import {useParameterComponentCommons} from "@AppBuilderLib/entities/parameter/model/useParameterComponentCommons";
import {
	defaultPropsParameterWrapper,
	PropsParameterComponent,
	PropsParameterWrapper,
} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {
	ISelectComponentItemDataType,
	SelectComponentType,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {validateSelectParameterSettings} from "@AppBuilderShared/types/shapediver/appbuildertypecheck";
import {Logger} from "@AppBuilderShared/utils/logger";
import {MantineThemeComponent, useProps} from "@mantine/core";
import {PARAMETER_VISUALIZATION} from "@shapediver/viewer.session";
import React, {useCallback, useMemo} from "react";
import MultiSelectComponent from "./multiselect/MultiSelectComponent";
import SelectComponent, {
	SelectComponentSettings,
} from "./select/SelectComponent";

interface ISelectComponentOverrides {
	/** Type of select component to use. */
	type?: SelectComponentType;
	/** Record containing optional further item data per item name. */
	itemData?: Record<string, ISelectComponentItemDataType>;
	/** Optional further settings, like image width etc. */
	settings?: SelectComponentSettings;
}

interface StyleProps {
	/** Defines settings for select components per parameter name. */
	componentSettings: Record<string, ISelectComponentOverrides>;
}

export const defaultStyleProps: Partial<StyleProps> = {};

type ParameterSelectComponentThemePropsType = Partial<StyleProps>;

export function ParameterSelectComponentThemeProps(
	props: ParameterSelectComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 *
 * @returns
 */
export default function ParameterSelectComponent(
	props: PropsParameterComponent &
		ParameterSelectComponentThemePropsType &
		Partial<PropsParameterWrapper>,
) {
	const {
		definition,
		value,
		handleChange,
		onCancel,
		disabled,
		formInputProps,
		formKey,
	} = useParameterComponentCommons<string>(props, 0);

	// theme properties
	const {componentSettings} = useProps(
		"ParameterSelectComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterSelectComponent",
		defaultPropsParameterWrapper,
		props,
	);

	// get component settings for the current parameter based on displayname or name from the theme
	const themeSettings = useMemo(() => {
		return (
			componentSettings?.[
				definition.displayname || definition.name || definition.id
			] || {}
		);
	}, [
		componentSettings,
		definition.name,
		definition.displayname,
		definition.id,
	]);

	// get the notification store
	const notifications = useNotificationStore();

	// get component settings from the parameter definition
	const definitionSettings = useMemo(() => {
		if (definition.settings) {
			const result = validateSelectParameterSettings(definition.settings);
			if (result.success) {
				return result.data;
			} else {
				notifications.error({
					title: "Invalid Parameter Settings",
					message: `Invalid settings for parameter "${definition.name}", see console for details.`,
				});
				Logger.warn(
					`Invalid settings for parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
				);
			}
		}
		return {};
	}, [definition.settings]);

	const settings = useMemo(() => {
		return {...themeSettings, ...definitionSettings};
	}, [themeSettings, definitionSettings]);

	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();

	// We need to prevent duplicate values in definition choices
	// and append a numeric postfix to duplicate items to make them unique
	const {uniqueChoices, uniqueChoicesIncludingHidden} = useMemo(() => {
		const uniqueChoices: string[] = [];
		const uniqueChoicesIncludingHidden: string[] = [];
		const choiceCounts: {[key: string]: number} = {};
		definition?.choices?.forEach((choice) => {
			const itemSettings = settings.itemData?.[choice];
			if (choiceCounts[choice] === undefined) {
				choiceCounts[choice] = 0;
			} else {
				choiceCounts[choice]++;
			}
			const choice_ =
				choiceCounts[choice] > 0
					? `${choice} ${choiceCounts[choice]}`
					: choice;
			if (!itemSettings?.hidden) uniqueChoices.push(choice_);
			uniqueChoicesIncludingHidden.push(choice_);
		});

		return {uniqueChoices, uniqueChoicesIncludingHidden};
	}, [definition.choices, settings.itemData]);

	// filter hidden choices from value
	const filteredValue = useMemo(() => {
		if (value === undefined || value === null || value == "")
			return undefined;
		const getIndex = (v: string) =>
			uniqueChoices.indexOf(uniqueChoicesIncludingHidden[+v]);
		if (definition.visualization === PARAMETER_VISUALIZATION.CHECKLIST) {
			const indexes = value
				.split(",")
				.map((v) => getIndex(v))
				.filter((index) => index >= 0);
			return indexes.length > 0 ? indexes.join(",") : undefined;
		} else {
			const index = getIndex(value);
			return index >= 0 ? index + "" : undefined;
		}
	}, [value, uniqueChoices, uniqueChoicesIncludingHidden]);

	const inputContainer = useCallback(
		(children: React.ReactNode) => {
			const isValid = React.isValidElement(children);
			if (!isValid) return children;
			const child = children as React.ReactElement<any>;
			return React.cloneElement(child, {
				onFocus: (e: any) => {
					child.props?.onFocus?.(e);
					onFocusHandler(e);
				},
				onBlur: (e: any) => {
					child.props?.onBlur?.(e);
					onBlurHandler();
				},
			});
		},
		[onFocusHandler, onBlurHandler],
	);

	const inputComponent =
		definition.visualization === PARAMETER_VISUALIZATION.CHECKLIST ? (
			<MultiSelectComponent
				key={formKey}
				{...(formInputProps || {})}
				value={
					filteredValue
						? filteredValue
								.split(",")
								.map((v) => uniqueChoices[parseInt(v)])
						: []
				}
				onChange={(v) => {
					const choices = uniqueChoicesIncludingHidden
						// Collect indexes and values
						.map((value, index) => ({index, value}))
						// Filter by values
						.filter((obj) => v.includes(obj.value))
						// Return filtered indexes
						.map((obj) => obj.index)
						.join(",");
					handleChange(choices, undefined, restoreFocus);
				}}
				items={uniqueChoices}
				disabled={disabled}
				inputContainer={inputContainer}
				type={settings.type}
				itemData={settings.itemData}
				settings={settings.settings}
				height={settings.height}
			/>
		) : (
			<SelectComponent
				key={formKey}
				{...(formInputProps || {})}
				value={
					filteredValue ? uniqueChoices[+filteredValue] : undefined
				}
				onChange={(v) => {
					handleChange(
						uniqueChoicesIncludingHidden.indexOf(v!) + "",
						undefined,
						restoreFocus,
					);
					if (formInputProps?.onChange) {
						formInputProps.onChange(v);
					}
				}}
				items={uniqueChoices}
				disabled={disabled}
				type={settings.type}
				itemData={settings.itemData}
				settings={settings.settings}
				inputContainer={inputContainer}
				onFocus={(e) => {
					onFocusHandler(e);
					if (formInputProps?.onFocus) {
						formInputProps.onFocus(e);
					}
				}}
				onBlur={() => {
					onBlurHandler();
					if (formInputProps?.onBlur) {
						formInputProps.onBlur();
					}
				}}
				searchable={settings.searchable}
				limit={settings.limit}
				height={settings.height}
			/>
		);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && inputComponent}
		</ParameterWrapperComponent>
	);
}
