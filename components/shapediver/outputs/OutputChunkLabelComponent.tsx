import TextWeighted from "@AppBuilderShared/components/ui/TextWeighted";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IShapeDiverOutputDefinitionChunk} from "@AppBuilderShared/types/shapediver/output";
import {Group, MantineThemeComponent, useProps} from "@mantine/core";
import React from "react";

interface Props {
	chunk: IShapeDiverOutputDefinitionChunk;
	/** Component to show on the right hand side of the label */
	rightSection?: React.ReactNode;
}

interface StyleProps {
	fontWeight: string;
}

const defaultStyleProps: Partial<StyleProps> = {};

type OutputChunkLabelComponentPropsType = Partial<StyleProps>;

export function OutputChunkLabelComponentThemeProps(
	props: OutputChunkLabelComponentPropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a label for an output chunk.
 *
 * @returns
 */
export default function OutputChunkLabelComponent(
	props: Props & Partial<StyleProps>,
) {
	const {fontWeight, rightSection, ...rest} = useProps(
		"OutputChunkLabelComponent",
		defaultStyleProps,
		props,
	);
	const {chunk} = rest;
	const {displayname, name, tooltip} = chunk;
	const label = displayname || name;

	const labelcomp = (
		<TextWeighted pb={4} size="sm" fontWeight="medium" fw={fontWeight}>
			{label}
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
			{rightSection}
		</Group>
	);
}
