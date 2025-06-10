import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import {useOutput} from "@AppBuilderShared/hooks/shapediver/parameters/useOutput";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {MantineThemeComponent, useProps} from "@mantine/core";
import React from "react";

interface StyleProps {
	fontWeight: string;
}

const defaultStyleProps: Partial<StyleProps> = {};

type OutputLabelComponentPropsType = Partial<StyleProps>;

export function OutputLabelComponentThemeProps(
	props: OutputLabelComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a label for an output.
 *
 * @returns
 */
export default function OutputStargateComponent(
	props: PropsOutput & Partial<StyleProps>,
) {
	const {definition} = useOutput(props);
	const {fontWeight} = useProps(
		"OutputLabelComponent",
		defaultStyleProps,
		props,
	);
	const {displayname, name} = definition;
	const label = displayname || name;
	return (
		<TextWeighted pb={4} size="sm" fontWeight="medium" fw={fontWeight}>
			{label}
		</TextWeighted>
	);
}
