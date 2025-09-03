import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useFocus} from "@AppBuilderShared/hooks/shapediver/parameters/useFocus";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {validateStringParameterSettings} from "@AppBuilderShared/types/shapediver/appbuildertypecheck";
import {Textarea, TextInput, useProps} from "@mantine/core";
import React, {useContext, useEffect, useMemo} from "react";

/**
 * Functional component that creates a string input component for a string parameter.
 *
 * @returns
 */
export default function ParameterStringComponent(
	props: PropsParameter & Partial<PropsParameterWrapper>,
) {
	const {definition, value, handleChange, onCancel, disabled} =
		useParameterComponentCommons<string>(props);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterStringComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const notifications = useContext(NotificationContext);
	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();

	const lines = useMemo(() => {
		if (definition?.settings) {
			const result = validateStringParameterSettings(definition.settings);
			if (result.success) {
				return result.data.lines ?? 1;
			} else {
				console.warn(
					`Invalid settings for parameter (id: "${definition.id}", name: "${definition.name}"): ${result.error}`,
				);
				return 1; // Return default value when validation fails
			}
		}
		return 1;
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

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition &&
				(lines > 1 ? (
					<Textarea
						value={value}
						onChange={(e) =>
							handleChange(
								e.currentTarget.value,
								undefined,
								restoreFocus,
							)
						}
						disabled={disabled}
						maxLength={definition.max}
						autosize
						minRows={lines}
						maxRows={lines}
						onFocus={onFocusHandler}
						onBlur={onBlurHandler}
					/>
				) : (
					<TextInput
						value={value}
						onChange={(e) =>
							handleChange(
								e.target.value,
								undefined,
								restoreFocus,
							)
						}
						disabled={disabled}
						maxLength={definition.max}
						onFocus={onFocusHandler}
						onBlur={onBlurHandler}
					/>
				))}
		</ParameterWrapperComponent>
	);
}
