import {useOutput} from "@AppBuilderShared/hooks/shapediver/parameters/useOutput";
import {useSdTFData} from "@AppBuilderShared/hooks/shapediver/viewer/useSdTFData";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {
	Accordion,
	MantineThemeComponent,
	Paper,
	Stack,
	StackProps,
	useProps,
} from "@mantine/core";
import React from "react";
import OutputChunkComponent from "./OutputChunkComponent";

interface StyleProps {
	stackProps?: StackProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	stackProps: {
		pb: "xs",
	},
};

export function OutputStargateComponentThemeProps(
	props: Partial<StyleProps>,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component that creates a label for an output and renders chunks in an expansion panel.
 *
 * @returns
 */
export default function OutputStargateComponent(
	props: PropsOutput & StyleProps,
) {
	const {namespace} = props;
	const {definition} = useOutput(props);

	const {stackProps} = useProps(
		"OutputStargateComponent",
		defaultStyleProps,
		props,
	);

	const {sdTFDataLoaded} = useSdTFData();

	return (
		<>
			{sdTFDataLoaded && definition && definition.chunks && (
				<Accordion>
					<Accordion.Item
						key={`${definition.id}-chunks`}
						value="chunks"
					>
						<Accordion.Control>
							{definition.displayname || definition.name}
						</Accordion.Control>
						<Accordion.Panel>
							{definition.chunks.map((chunk) => (
								<Stack key={chunk.id} {...stackProps}>
									<Paper>
										<OutputChunkComponent
											chunk={chunk}
											output={definition}
											sessionId={namespace}
										/>
									</Paper>
								</Stack>
							))}
						</Accordion.Panel>
					</Accordion.Item>
				</Accordion>
			)}
		</>
	);
}
