import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import {useFocus} from "@AppBuilderShared/hooks/shapediver/parameters/useFocus";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {
	defaultPropsParameterWrapper,
	PropsParameter,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {MantineThemeComponent, MultiSelect, useProps} from "@mantine/core";
import {PARAMETER_VISUALIZATION} from "@shapediver/viewer.session";
import React, {useCallback, useMemo} from "react";
import SelectComponent, {
	SelectComponentItemDataType,
	SelectComponentSettings,
	SelectComponentType,
} from "./select/SelectComponent";

interface ISelectComponentOverrides {
	/** Type of select component to use. */
	type?: SelectComponentType;
	/** Record containing optional further item data per item name. */
	itemData?: Record<string, SelectComponentItemDataType>;
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
	props: PropsParameter &
		ParameterSelectComponentThemePropsType &
		Partial<PropsParameterWrapper>,
) {
	const {definition, value, handleChange, onCancel, disabled} =
		useParameterComponentCommons<string>(props, 0);

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

	// get component settings for the current parameter based on displayname or name
	const settings = useMemo(() => {
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

	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();

	// We need to prevent duplicate values in definition choices
	// and append a numeric postfix to duplicate items to make them unique
	const uniqueChoices = useMemo(() => {
		if (!definition.choices) return [];
		const uniqueChoices: string[] = [];
		const choiceCounts: {[key: string]: number} = {};
		definition.choices.forEach((choice) => {
			if (choiceCounts[choice] === undefined) {
				choiceCounts[choice] = 0;
			} else {
				choiceCounts[choice]++;
			}
			uniqueChoices.push(
				choiceCounts[choice] > 0
					? `${choice} ${choiceCounts[choice]}`
					: choice,
			);
		});

		return uniqueChoices;
	}, [definition.choices]);

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

	const inputComponent =
		definition.visualization === PARAMETER_VISUALIZATION.CHECKLIST ? (
			<MultiSelect
				value={
					value
						? value
								.split(",")
								.map((v) => uniqueChoices[parseInt(v)])
						: []
				}
				onChange={(v) => {
					const choices = uniqueChoices
						// Collect indexes and values
						.map((value, index) => ({index, value}))
						// Filter by values
						.filter((obj) => v.includes(obj.value))
						// Return filtered indexes
						.map((obj) => obj.index)
						.join(",");
					handleChange(choices, undefined, restoreFocus);
				}}
				data={uniqueChoices}
				disabled={disabled}
				inputContainer={inputContainer}
			/>
		) : (
			<SelectComponent
				value={uniqueChoices[+value]}
				onChange={(v) =>
					handleChange(
						uniqueChoices.indexOf(v!) + "",
						undefined,
						restoreFocus,
					)
				}
				items={uniqueChoices}
				disabled={disabled}
				type={settings.type}
				itemData={settings.itemData}
				settings={settings.settings}
				inputContainer={inputContainer}
				onFocus={onFocusHandler}
				onBlur={onBlurHandler}
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
