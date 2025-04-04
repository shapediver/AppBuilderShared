import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useExport} from "@AppBuilderShared/hooks/shapediver/parameters/useExport";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {MantineThemeComponent, useProps} from "@mantine/core";
import React from "react";

interface StyleProps {
	fontWeight: string;
}

const defaultStyleProps: Partial<StyleProps> = {};

type ParameterLabelComponentPropsType = Partial<StyleProps>;

export function ExportLabelComponentThemeProps(
	props: ParameterLabelComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a label for an export.
 *
 * @returns
 */
export default function ExportLabelComponent(
	props: PropsExport & Partial<StyleProps>,
) {
	const {definition} = useExport(props);
	const {fontWeight} = useProps(
		"ExportLabelComponent",
		defaultStyleProps,
		props,
	);
	const {displayname, name, tooltip} = definition;
	const label = displayname || name;

	const labelcomp = (
		<TextWeighted pb={4} size="sm" fontWeight="medium" fw={fontWeight}>
			{label}
		</TextWeighted>
	);

	return tooltip ? (
		<TooltipWrapper label={tooltip} position="top">
			{labelcomp}
		</TooltipWrapper>
	) : (
		labelcomp
	);
}
