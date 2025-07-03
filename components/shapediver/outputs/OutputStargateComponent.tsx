import {useOutput} from "@AppBuilderShared/hooks/shapediver/parameters/useOutput";
import {useSdTFData} from "@AppBuilderShared/hooks/shapediver/viewer/useSdTFData";
import {PropsOutput} from "@AppBuilderShared/types/components/shapediver/propsOutput";
import {
	Accordion,
	AccordionControlProps,
	AccordionItemProps,
	AccordionPanelProps,
	AccordionProps,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Stack,
	StackProps,
	useProps,
} from "@mantine/core";
import React from "react";
import OutputChunkComponent from "./OutputChunkComponent";

interface StyleProps {
	stackProps?: StackProps;
	paperProps?: PaperProps;
	accordionProps?: AccordionProps;
	accordionItemProps?: AccordionItemProps;
	accordionControlProps?: AccordionControlProps;
	accordionPanelProps?: AccordionPanelProps;
}

const defaultStyleProps: Partial<StyleProps> = {};

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

	const {
		stackProps,
		paperProps,
		accordionProps,
		accordionItemProps,
		accordionControlProps,
		accordionPanelProps,
	} = useProps("OutputStargateComponent", defaultStyleProps, props);

	const {sdTFDataLoaded} = useSdTFData();

	return (
		sdTFDataLoaded &&
		definition &&
		definition.chunks && (
			<Accordion {...accordionProps}>
				<Accordion.Item
					{...accordionItemProps}
					key={`${definition.id}-chunks`}
					value="chunks"
				>
					<Accordion.Control {...accordionControlProps}>
						{definition.displayname || definition.name}
					</Accordion.Control>
					<Accordion.Panel {...accordionPanelProps} key="chunks">
						<Stack {...stackProps}>
							{definition.chunks.map((chunk) => (
								<Paper key={chunk.id} {...paperProps}>
									<OutputChunkComponent
										chunk={chunk}
										output={definition}
										sessionId={namespace}
									/>
								</Paper>
							))}
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>
			</Accordion>
		)
	);
}
