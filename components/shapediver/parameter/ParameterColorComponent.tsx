import {Icon} from "@AppBuilderLib/shared/ui/icon";
import ParameterLabelComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterLabelComponent";
import ParameterWrapperComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterWrapperComponent";
import {useFocus} from "@AppBuilderShared/hooks/shapediver/parameters/useFocus";
import {useParameterComponentCommons} from "@AppBuilderShared/hooks/shapediver/parameters/useParameterComponentCommons";
import {
	defaultPropsParameterWrapper,
	PropsParameterComponent,
	PropsParameterWrapper,
} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {
	ColorFormatType,
	convertFromSdColor,
	convertToSdColor,
} from "@AppBuilderShared/utils/misc/colors";
import {
	ActionIcon,
	ColorInput,
	MantineThemeComponent,
	useProps,
} from "@mantine/core";
import React, {useCallback, useEffect, useState} from "react";

interface StyleProps {
	colorFormat: ColorFormatType;
}

const defaultStyleProps: StyleProps = {
	colorFormat: "rgba",
};

type ParameterColorComponentPropsType = Partial<StyleProps>;

export function ParameterColorComponentThemeProps(
	props: ParameterColorComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a color swatch for a color parameter.
 *
 * @returns
 */
export default function ParameterColorComponent(
	props: PropsParameterComponent & Partial<PropsParameterWrapper>,
) {
	const {colorFormat} = useProps(
		"ParameterColorComponent",
		defaultStyleProps,
		defaultStyleProps,
	);

	const {wrapperComponent, wrapperProps} = useProps(
		"ParameterColorComponent",
		defaultPropsParameterWrapper,
		props,
	);

	const {
		definition,
		handleChange,
		value: paramValue,
		onCancel,
		disabled,
		formInputProps,
		formKey,
	} = useParameterComponentCommons<string>(
		props,
		0,
		(state) => state.uiValue,
	);

	const {onFocusHandler, onBlurHandler, restoreFocus} = useFocus();
	const handleSdColorChange = useCallback(
		(val: string) => {
			handleChange(
				convertToSdColor(val, colorFormat),
				undefined,
				restoreFocus,
			);
		},
		[handleChange, colorFormat, restoreFocus],
	);

	const [value, setValue] = useState(
		convertFromSdColor(paramValue, colorFormat),
	);

	useEffect(() => {
		setValue(convertFromSdColor(paramValue, colorFormat));
	}, [paramValue, colorFormat]);

	return (
		<ParameterWrapperComponent
			onCancel={onCancel}
			component={wrapperComponent}
			{...wrapperProps}
		>
			<ParameterLabelComponent {...props} cancel={onCancel} />
			{definition && (
				<ColorInput
					key={formKey}
					{...(formInputProps || {})}
					placeholder="Pick color"
					value={value}
					rightSection={
						<ActionIcon
							onClick={() =>
								handleChange(
									definition.defval!,
									undefined,
									restoreFocus,
								)
							}
						>
							<Icon iconType={"tabler:refresh"} />
						</ActionIcon>
					}
					onChange={setValue}
					onChangeEnd={handleSdColorChange}
					disabled={disabled}
					format={colorFormat}
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
			)}
		</ParameterWrapperComponent>
	);
}
