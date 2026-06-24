import {IStringParameterSelectSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {validateStringParameterSettings} from "@AppBuilderLib/features/appbuilder/config/appbuildertypecheck";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {
	MantineThemeComponent,
	Textarea,
	TextInput,
	useProps,
} from "@mantine/core";
import React, {useCallback, useEffect, useMemo} from "react";
import {
	defaultPropsParameterWrapper,
	PropsParameterComponent,
	PropsParameterWrapper,
} from "../config/propsParameter";
import {useFocus} from "../model/useFocus";
import {useParameterComponentCommons} from "../model/useParameterComponentCommons";
import ParameterLabelComponent from "./ParameterLabelComponent";
import ParameterWrapperComponent from "./ParameterWrapperComponent";
import SelectComponent from "./select/SelectComponent";

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.ParameterStringComponent.defaultProps
 * @displayName ParameterStringComponent
 */
export interface ParameterStringComponentStyleProps {
	/** Select settings per parameter name, displayname, or id (see ParameterSelectComponent). */
	componentSettings?: Record<string, IStringParameterSelectSettings>;
}

export const defaultStyleProps: Partial<ParameterStringComponentStyleProps> =
	{};

export type ParameterStringComponentThemePropsType =
	Partial<ParameterStringComponentStyleProps>;

export function ParameterStringComponentThemeProps(
	props: ParameterStringComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a string input component for a string parameter.
 *
 * @returns
 */
export default function ParameterStringComponent(
	props: PropsParameterComponent &
		ParameterStringComponentThemePropsType &
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
	} = useParameterComponentCommons<string>(props);

	const {componentSettings} = useProps(
		"ParameterStringComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterStringComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const notifications = useNotificationStore();
	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();

	const themeSelectSettings = useMemo(() => {
		if (!definition) {
			return undefined;
		}
		return componentSettings?.[
			definition.displayname || definition.name || definition.id
		];
	}, [
		componentSettings,
		definition?.displayname,
		definition?.name,
		definition?.id,
	]);

	const {lines, selectSettings} = useMemo(() => {
		let definitionLines: number | undefined;
		let definitionSelectSettings:
			| IStringParameterSelectSettings
			| undefined;

		if (definition?.settings) {
			const result = validateStringParameterSettings(definition.settings);
			if (result.success) {
				definitionLines = result.data.lines;
				definitionSelectSettings = result.data.selectSettings;
			} else {
				Logger.warn(
					`Invalid settings for parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
				);
			}
		}

		const mergedSelectSettings =
			themeSelectSettings || definitionSelectSettings
				? {
						...themeSelectSettings,
						...definitionSelectSettings,
					}
				: undefined;

		return {lines: definitionLines, selectSettings: mergedSelectSettings};
	}, [
		definition?.settings,
		definition?.id,
		definition?.name,
		themeSelectSettings,
	]);

	// Show error notification in useEffect to avoid setState during render
	useEffect(() => {
		if (definition?.settings) {
			const result = validateStringParameterSettings(definition.settings);
			if (!result.success) {
				notifications.error({
					title: "Invalid Parameter Settings",
					message: `Invalid settings for parameter "${definition.name}", see console for details.`,
				});
			}
		}
	}, [definition?.settings, definition?.name, notifications]);

	const inputContainer = useCallback(
		(children: React.ReactNode) => {
			const isValid = React.isValidElement(children);
			return (
				<>
					{isValid
						? React.cloneElement(
								children as React.ReactElement<any>,
								{
									onFocus: onFocusHandler,
									onBlur: onBlurHandler,
								},
							)
						: children}
				</>
			);
		},
		[onFocusHandler, onBlurHandler],
	);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition &&
				(selectSettings &&
				(selectSettings.items ||
					selectSettings.source ||
					selectSettings.database) ? (
					<SelectComponent
						key={formKey}
						value={value || undefined}
						{...(formInputProps || {})}
						onChange={(v) => {
							const val = v ?? "";
							handleChange(val, undefined, restoreFocus);
							if (formInputProps?.onChange) {
								formInputProps.onChange(val);
							}
						}}
						disabled={disabled}
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
						items={selectSettings.items ?? []}
						{...selectSettings}
					/>
				) : lines !== undefined ? (
					<Textarea
						key={formKey}
						value={value}
						{...(formInputProps || {})}
						onChange={(e) => {
							handleChange(
								e.currentTarget.value,
								undefined,
								restoreFocus,
							);
							if (formInputProps?.onChange) {
								formInputProps.onChange(e);
							}
						}}
						disabled={disabled}
						maxLength={definition.max}
						autosize
						minRows={lines}
						maxRows={lines}
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
					/>
				) : (
					<TextInput
						key={formKey}
						{...(formInputProps || {})}
						value={value}
						onChange={(e) => {
							handleChange(
								e.target.value,
								undefined,
								restoreFocus,
							);
							if (formInputProps?.onChange) {
								formInputProps.onChange(e);
							}
						}}
						disabled={disabled}
						maxLength={definition.max}
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
					/>
				))}
		</ParameterWrapperComponent>
	);
}
