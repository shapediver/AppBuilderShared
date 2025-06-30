import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useExport} from "@AppBuilderShared/hooks/shapediver/parameters/useExport";
import {PropsExport} from "@AppBuilderShared/types/components/shapediver/propsExport";
import {MantineThemeComponent, useProps} from "@mantine/core";
import React from "react";

interface Props extends PropsExport {
	/** Optional label overriding the default label */
	label?: string;
}

interface StyleProps {
	fontWeight: string;
}

const defaultStyleProps: Partial<StyleProps> = {};

type ExportLabelComponentPropsType = Partial<StyleProps>;

export function ExportLabelComponentThemeProps(
	props: ExportLabelComponentPropsType,
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
	props: Props & Partial<StyleProps>,
) {
	const {label, ...rest} = props;
	const {definition} = useExport(props);
	const {fontWeight} = useProps(
		"ExportLabelComponent",
		defaultStyleProps,
		rest,
	);
	const {displayname, name, tooltip} = definition;
	const label_ = label || displayname || name;

	const labelcomp = (
		<TextWeighted pb={4} size="sm" fontWeight="medium" fw={fontWeight}>
			{label_}
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
