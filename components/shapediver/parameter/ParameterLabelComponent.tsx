import Icon from "@AppBuilderShared/components/ui/Icon";
import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useParameter} from "@AppBuilderShared/hooks/shapediver/parameters/useParameter";
import {PropsParameter} from "@AppBuilderShared/types/components/shapediver/propsParameter";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	Group,
	MantineThemeComponent,
	TooltipProps,
	useProps,
} from "@mantine/core";

import React from "react";
interface Props extends PropsParameter {
	cancel?: () => void;
	rightSection?: React.ReactNode;
}

interface StyleProps {
	tooltipProps: Partial<TooltipProps>;
	fontWeight: string;
}

const defaultStyleProps: Partial<StyleProps> = {
	tooltipProps: {
		position: "top",
		label: "Cancel change",
	},
};

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
	const {cancel, rightSection, ...rest} = props;
	const {fontWeight, tooltipProps} = useProps(
		"ParameterLabelComponent",
		defaultStyleProps,
		rest,
	);
	const {definition} = useParameter<any>(props);
	const {displayname, name, tooltip} = definition;
	const label = displayname || name;

	const labelcomp = (
		<TextWeighted pb={4} size="sm" fontWeight="medium" fw={fontWeight}>
			{label}
			{cancel ? " *" : ""}
		</TextWeighted>
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
				<TooltipWrapper
					{...tooltipProps}
					label={tooltipProps?.label || "Cancel change"}
				>
					<Icon
						type={IconTypeEnum.X}
						color="var(--mantine-primary-color-filled)"
						onClick={cancel}
					/>
				</TooltipWrapper>
			)}
			{rightSection}
		</Group>
	);
}
