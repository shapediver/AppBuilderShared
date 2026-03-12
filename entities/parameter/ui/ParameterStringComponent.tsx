import {
	defaultPropsParameterWrapper,
	PropsParameterComponent,
	PropsParameterWrapper,
} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {useFocus} from "@AppBuilderLib/entities/parameter/model/useFocus";
import {useParameterComponentCommons} from "@AppBuilderLib/entities/parameter/model/useParameterComponentCommons";
import ParameterLabelComponent from "@AppBuilderLib/entities/parameter/ui/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderLib/entities/parameter/ui/ParameterWrapperComponent";
import {validateStringParameterSettings} from "@AppBuilderLib/features/appbuilder/config/appbuildertypecheck";
import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {Textarea, TextInput, useProps} from "@mantine/core";
import React, {useCallback, useEffect, useMemo} from "react";
import SelectComponent from "./select/SelectComponent";

/**
 * Functional component that creates a string input component for a string parameter.
 *
 * @returns
 */
export default function ParameterStringComponent(
	props: PropsParameterComponent & Partial<PropsParameterWrapper>,
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

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterStringComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const notifications = useNotificationStore();
	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();

	const {lines, selectSettings} = useMemo(() => {
		if (definition?.settings) {
			const result = validateStringParameterSettings(definition.settings);
			if (result.success) {
				const selectSettings = result.data.selectSettings;
				return {lines: result.data.lines, selectSettings};
			} else {
				Logger.warn(
					`Invalid settings for parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
				);
				return {lines: undefined}; // Return undefined when validation fails
			}
		}
		return {lines: undefined};
	}, [definition?.settings, definition?.id, definition?.name]);

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
				(selectSettings.items || selectSettings.source) ? (
					<SelectComponent
						key={formKey}
						value={undefined}
						{...(formInputProps || {})}
						onChange={(v) => {
							const val = v ?? "";
							handleChange(val, undefined, restoreFocus);
							if (formInputProps?.onChange) {
								formInputProps.onChange(val);
							}
						}}
						disabled={disabled}
						// TODO add these settings as an optional theme property to the ParameterStringComponent
						//settings={settings.settings}
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
