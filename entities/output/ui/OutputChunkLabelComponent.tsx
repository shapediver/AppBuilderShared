import {IShapeDiverOutputDefinitionChunk} from "@AppBuilderLib/entities/output";
import {TextWeighted} from "@AppBuilderLib/shared/ui/text";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import {Group, MantineThemeComponent, useProps} from "@mantine/core";
import React from "react";

interface Props {
	chunk: IShapeDiverOutputDefinitionChunk;
	/** Component to show on the right hand side of the label */
	rightSection?: React.ReactNode;
}

/**
 * @docAttached
 * @configPath themeOverrides.components.OutputChunkLabelComponent.defaultProps
 * @displayName OutputChunkLabelComponent
 */
export interface OutputChunkLabelComponentStyleProps {
	/** Font weight for chunk title (`fw` on label text). */
	fontWeight: string;
}

const defaultStyleProps: Partial<OutputChunkLabelComponentStyleProps> = {};

type OutputChunkLabelComponentPropsType =
	Partial<OutputChunkLabelComponentStyleProps>;

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
	props: Props & Partial<OutputChunkLabelComponentStyleProps>,
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
