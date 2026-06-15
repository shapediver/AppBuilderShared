import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import {useOutput} from "@AppBuilderLib/entities/output/model/useOutput";
import type {MantineAccordionProps} from "@AppBuilderLib/shared/mantine-props/accordion";
import type {MantineAccordionControlProps} from "@AppBuilderLib/shared/mantine-props/accordionControl";
import type {MantineAccordionItemProps} from "@AppBuilderLib/shared/mantine-props/accordionItem";
import type {MantineAccordionPanelProps} from "@AppBuilderLib/shared/mantine-props/accordionPanel";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import type {MantineStackProps} from "@AppBuilderLib/shared/mantine-props/stack";
import {
	Accordion,
	MantineThemeComponent,
	Paper,
	Stack,
	useProps,
} from "@mantine/core";
import React from "react";
import {useSdTFData} from "../model/useSdTFData";
import OutputChunkComponent from "./OutputChunkComponent";

/**
 * @docAttached
 * @configPath themeOverrides.components.OutputStargateComponent.defaultProps
 * @displayName OutputStargateComponent
 */
export interface OutputStargateComponentStyleProps {
	stackProps?: MantineStackProps;
	paperProps?: MantinePaperProps;
	accordionProps?: MantineAccordionProps;
	accordionItemProps?: MantineAccordionItemProps;
	accordionControlProps?: MantineAccordionControlProps;
	accordionPanelProps?: MantineAccordionPanelProps;
}

const defaultStyleProps: Partial<OutputStargateComponentStyleProps> = {
	paperProps: {shadow: "none"},
};

export function OutputStargateComponentThemeProps(
	props: Partial<OutputStargateComponentStyleProps>,
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
	props: PropsOutput & Partial<OutputStargateComponentStyleProps>,
) {
	const {namespace} = props;
	const {definition} = useOutput(props) ?? {};

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
