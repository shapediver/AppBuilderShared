import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useParameter";
import {useDefaultFontWeight} from "@AppBuilderShared/hooks/ui/useDefaultFontWeight";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {Group, MantineThemeComponent, Text, useProps} from "@mantine/core";

import React from "react";
interface Props extends PropsParameter {
	cancel?: () => void;
}

interface StyleProps {
	fontWeight: string;
}

const defaultStyleProps: Partial<StyleProps> = {};

type ParameterLabelComponentPropsType = Partial<StyleProps>;

export function ParameterLabelComponentThemeProps(
	props: ParameterLabelComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a label for a parameter or .
 *
 * @returns
 */
export default function ParameterLabelComponent(
	props: Props & Partial<StyleProps>,
) {
	const {cancel, ...rest} = props;
	const {fontWeight: _fontWeight} = useProps(
		"ParameterLabelComponent",
		defaultStyleProps,
		rest,
	);
	const fontWeight = useDefaultFontWeight(_fontWeight, "medium");
	const {definition} = useParameter<any>(props);
	const {displayname, name, tooltip} = definition;
	const label = displayname || name;

	const labelcomp = (
		<Text pb={4} size="sm" fw={fontWeight}>
			{label}
		</Text>
	);

	return (
		<Group justify="space-between" w="100%" wrap="nowrap">
			{tooltip ? (
				<TooltipWrapper label={tooltip} position="top">
					{labelcomp}
				</TooltipWrapper>
			) : (
				labelcomp
			)}
			{cancel && (
				<Icon type={IconTypeEnum.X} color="red" onClick={cancel} />
			)}
		</Group>
	);
}
