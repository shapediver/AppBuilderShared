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
import {ParameterStringInputMode} from "../config/ParameterStringComponent.theme.types";
import {resolveStringSelectEmitValue} from "../lib/select/resolveStringSelectEmitValue";
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
	/**
	 * Debounce delay in milliseconds before recomputing after text changes.
	 * Used when `mode` is `"debounce"`.
	 * @default 2000
	 */
	debounce?: number;
	/**
	 * When {@link ParameterStringInputMode.Debounce}, recompute after the user stops typing.
	 * When {@link ParameterStringInputMode.Validate}, recompute on blur (and Enter for single-line input).
	 * @default ParameterStringInputMode.Debounce
	 */
	mode?: ParameterStringInputMode;
}

export const defaultStyleProps = {
	debounce: 2000,
	mode: ParameterStringInputMode.Debounce,
} as const satisfies ParameterStringComponentStyleProps;

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
	const {componentSettings, debounce, mode} = useProps(
		"ParameterStringComponent",
		defaultStyleProps,
		props,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterStringComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const {
		definition,
		state,
		value,
		setValue,
		handleChange,
		onCancel,
		disabled,
		formInputProps,
		formKey,
	} = useParameterComponentCommons<string>(props, debounce);

	const notifications = useNotificationStore();
	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();

	const onTextChange = useCallback(
		(next: string) => {
			if (mode === ParameterStringInputMode.Validate) {
				setValue(next);
			} else {
				handleChange(next, undefined, restoreFocus);
			}
		},
		[mode, setValue, handleChange, restoreFocus],
	);

	const commitImmediate = useCallback(
		(next: string, restore?: () => void) => {
			if (next === state.uiValue) {
				return;
			}
			handleChange(next, 0, restore);
		},
		[handleChange, state.uiValue],
	);

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
							handleChange(val, 0, restoreFocus);
							if (formInputProps?.onChange) {
								formInputProps.onChange(val);
							}
						}}
						disabled={disabled}
						emitValue={resolveStringSelectEmitValue(selectSettings)}
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
							onTextChange(e.currentTarget.value);
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
						onBlur={(e) => {
							if (e.currentTarget.disabled) {
								return;
							}
							commitImmediate(e.currentTarget.value);
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
							onTextChange(e.target.value);
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
						onBlur={(e) => {
							if (e.currentTarget.disabled) {
								return;
							}
							commitImmediate(e.currentTarget.value);
							onBlurHandler();
							if (formInputProps?.onBlur) {
								formInputProps.onBlur();
							}
						}}
						onKeyDown={(e) => {
							if (
								e.key !== "Enter" ||
								e.nativeEvent.isComposing
							) {
								return;
							}
							if (!formInputProps) {
								e.preventDefault();
							}
							commitImmediate(
								e.currentTarget.value,
								restoreFocus,
							);
						}}
					/>
				))}
		</ParameterWrapperComponent>
	);
}
