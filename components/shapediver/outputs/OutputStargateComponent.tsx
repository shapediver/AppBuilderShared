import {useOutput} from "@AppBuilderShared/hooks/shapediver/parameters/useOutput";
import {useStargateConnection} from "@AppBuilderShared/hooks/shapediver/stargate/useStargateConnection";
import {useShapeDiverStoreStargate} from "@AppBuilderShared/store/useShapeDiverStoreStargate";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {Accordion, MantineThemeComponent, Paper, Stack} from "@mantine/core";
import React from "react";
import OutputChunckComponent from "./OutputChunckComponent";
import OutputLabelComponent from "./OutputLabelComponent";

interface StyleProps {
	fontWeight: string;
}
type OutputLabelComponentPropsType = Partial<StyleProps>;

export function OutputLabelComponentThemeProps(
	props: OutputLabelComponentPropsType,
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
	props: PropsOutput & Partial<StyleProps>,
) {
	const {namespace} = props;
	const {definition} = useOutput(props);

	const {networkStatus, isLoading, selectedClient} =
		useShapeDiverStoreStargate();

	const {supportedData} = useStargateConnection();

	return (
		<>
			<OutputLabelComponent {...props} />
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
								<Stack key={chunk.id} pb={"xs"}>
									<Paper>
										<OutputChunckComponent
											chunk={chunk}
											outputId={definition.id}
											outputName={definition.name}
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
