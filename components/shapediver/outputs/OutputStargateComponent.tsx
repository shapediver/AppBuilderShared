import {useOutput} from "@AppBuilderShared/hooks/shapediver/parameters/useOutput";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
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
import {useShallow} from "zustand/react/shallow";
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

	const {networkStatus, isLoading, selectedClient, supportedData} =
		useShapeDiverStoreStargate(
			useShallow((state) => ({
				networkStatus: state.networkStatus,
				isLoading: state.isLoading,
				selectedClient: state.selectedClient,
				supportedData: state.supportedData,
			})),
		);

	return (
		<>
			{definition && definition.chunks && (
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
											networkStatus={networkStatus}
											supportedData={supportedData}
											selectedClient={selectedClient}
											sessionId={namespace}
											isLoading={isLoading}
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
