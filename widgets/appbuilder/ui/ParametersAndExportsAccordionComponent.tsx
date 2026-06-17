import {PropsExport} from "@AppBuilderLib/entities/export/config/propsExport";
import {PropsOutput} from "@AppBuilderLib/entities/output/config/propsOutput";
import OutputStargateComponent from "@AppBuilderLib/entities/output/ui/OutputStargateComponent";
import {PropsParameter} from "@AppBuilderLib/entities/parameter/config/propsParameter";
import {
	isExportDefinition,
	isOutputDefinition,
	isParamDefinition,
	useSortedParametersAndExports,
} from "@AppBuilderLib/entities/parameter/model/useSortedParametersAndExports";
import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {
	getExportComponent,
	getParameterComponent,
} from "@AppBuilderLib/features/appbuilder/config/componentTypes";
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
import React, {ReactElement, useContext} from "react";

/**
 * Functional component that creates an accordion of parameter and export components.
 *
 * @returns
 */

interface Props {
	/**
	 * The parameters to be displayed in the accordion.
	 */
	parameters?: PropsParameter[];
	/**
	 * The exports to be displayed in the accordion.
	 */
	exports?: PropsExport[];
	/**
	 * The outputs to be displayed in the accordion.
	 */
	outputs?: PropsOutput[];
	/**
	 * Component to be displayed at the top of the accordion. Typically used for
	 * accept / reject buttons.
	 */
	topSection?: React.ReactNode;
	/**
	 * Namespace of the parameters and exports.
	 */
	namespace?: string;
}

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.ParametersAndExportsAccordionComponent.defaultProps
 * @displayName ParametersAndExportsAccordionComponent
 */
export interface ParametersAndExportsAccordionComponentStyleProps {
	/**
	 * Name of group to use for parameters and exports which are not assigned to a group.
	 * Leave this empty to not display such parameters and exports inside of an accordion.
	 */
	defaultGroupName?: string;
	/**
	 * Set this to true to avoid groups containing a single parameter or export component.
	 * In case this is not set or true, parameters and exports of groups with a single
	 * component will be displayed without using an accordion.
	 */
	avoidSingleComponentGroups?: boolean;
	/**
	 * Merge accordions of subsequent groups into one.
	 */
	mergeAccordions?: boolean;
	/**
	 * Bottom padding of Paper component wrapping slider components.
	 */
	pbSlider?: string;
	/**
	 * Set this to true to identify groups by id instead of name. If so,
	 * multiple groups with the same name will be displayed as separate groups.
	 */
	identifyGroupsById?: boolean;
	/**
	 * Props for the Paper component wrapping each accordion.
	 */
	accordionPaperProps?: MantinePaperProps;
	/**
	 * Props for the Paper component wrapping each element inside the accordion.
	 */
	elementPaperProps?: MantinePaperProps;
	/**
	 * Props for the Accordion component.
	 */
	accordionProps?: MantineAccordionProps;
	/**
	 * Props for the c.Item component.
	 */
	accordionItemProps?: MantineAccordionItemProps;
	/**
	 * Props for the Accordion.Control component.
	 */
	accordionControlProps?: MantineAccordionControlProps;
	/**
	 * Props for the Accordion.Panel component.
	 */
	accordionPanelProps?: MantineAccordionPanelProps;
	/**
	 * Props for the Stack component wrapping everything.
	 */
	wrapperStackProps?: MantineStackProps;
	/**
	 * Props for the Stack component wrapping the elements except the topSection.
	 */
	elementStackProps?: MantineStackProps;
	/**
	 * Props for the Stack component wrapping the elements inside accordion panels.
	 */
	panelStackProps?: MantineStackProps;
}

const defaultStyleProps: Partial<ParametersAndExportsAccordionComponentStyleProps> =
	{
		avoidSingleComponentGroups: true,
		mergeAccordions: false,
		pbSlider: "md",
		identifyGroupsById: false,
		accordionPaperProps: {px: 0, py: 0, withBorder: false, shadow: "md"},
		elementPaperProps: {shadow: "none" /*, withBorder: true*/},
	};

export function ParametersAndExportsAccordionComponentThemeProps(
	props: Partial<ParametersAndExportsAccordionComponentStyleProps>,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ParametersAndExportsAccordionComponent(
	props: Props & ParametersAndExportsAccordionComponentStyleProps,
) {
	const {parameters, exports, outputs, topSection, namespace, ...rest} =
		props;

	// get sorted list of parameter and export definitions
	const sortedParamsAndExports = useSortedParametersAndExports(
		parameters,
		exports,
		outputs,
	);

	const componentContext = useContext(ComponentContext);

	// style properties
	const {
		pbSlider,
		avoidSingleComponentGroups,
		defaultGroupName,
		mergeAccordions,
		identifyGroupsById,
		accordionPaperProps,
		elementPaperProps,
		accordionProps,
		accordionItemProps,
		accordionControlProps,
		accordionPanelProps,
		wrapperStackProps,
		elementStackProps,
		panelStackProps,
	} = useProps(
		"ParametersAndExportsAccordionComponent",
		defaultStyleProps,
		rest,
	);

	// create a data structure to store the elements within groups
	const elementGroups: {
		group?: {id: string; name: string};
		elements: ReactElement[];
	}[] = [];
	const groupIds: {[key: string]: number} = {};

	// as long as there are no parameters, show a loader
	if (sortedParamsAndExports.length === 0) {
		return <></>;
	}

	// loop through the parameters and store the created elements in the elementGroups
	sortedParamsAndExports.forEach((param) => {
		// if a parameter is hidden, skip it
		if (param.definition.hidden) return;

		// read out the group or specify a new one if none has been provided
		const group =
			param.definition.group ||
			(defaultGroupName
				? {id: "default", name: defaultGroupName}
				: undefined);
		const groupIdentifier = identifyGroupsById ? group?.id : group?.name;
		if (!group) {
			elementGroups.push({elements: []});
		} else if (!(groupIdentifier! in groupIds)) {
			elementGroups.push({group, elements: []});
			groupIds[groupIdentifier!] = elementGroups.length - 1;
		}
		const groupId = group
			? groupIds[groupIdentifier!]
			: elementGroups.length - 1;

		if (isParamDefinition(param)) {
			// Get the element for the parameter and add it to the group
			const {component: ParameterComponent, extraBottomPadding} =
				getParameterComponent(componentContext, param.definition);

			elementGroups[groupId].elements.push(
				<ParameterComponent
					key={param.definition.id}
					{...param.parameter}
					wrapperComponent={Paper}
					wrapperProps={{
						...elementPaperProps,
						pb: extraBottomPadding ? pbSlider : undefined,
					}}
					disableIfDirty={
						param.parameter.disableIfDirty ??
						!param.parameter.acceptRejectMode
					}
				/>,
			);
		} else if (isExportDefinition(param)) {
			// Get the element for the export and add it to the group
			const ExportComponent = getExportComponent(
				componentContext,
				param.definition,
			);

			elementGroups[groupId].elements.push(
				<Paper key={param.definition.id} {...elementPaperProps}>
					<ExportComponent {...param.export} />
				</Paper>,
			);
		} else if (isOutputDefinition(param) && namespace) {
			elementGroups[groupId].elements.push(
				<Paper key={param.definition.id} {...accordionPaperProps}>
					<OutputStargateComponent
						key={param.definition.id}
						{...param.output}
						namespace={namespace}
					/>
				</Paper>,
			);
		}
	});

	const elements: ReactElement[] = [];
	const addAccordion = (
		items: ReactElement[],
		defaultValue: string | undefined = undefined,
	) => {
		elements.push(
			// wrap accordion in paper to show optional shadows
			<Paper key={items[0].key} {...accordionPaperProps}>
				<Accordion {...accordionProps} defaultValue={defaultValue}>
					{items}
				</Accordion>
			</Paper>,
		);
	};

	// in case there is only one group, open it by default
	const defaultValue =
		elementGroups.length === 1 && elementGroups[0].group
			? elementGroups[0].group?.id
			: undefined;

	// loop through the created elementGroups to add them
	let accordionItems: ReactElement[] = [];
	elementGroups.map((g) => {
		if (g.group && (!avoidSingleComponentGroups || g.elements.length > 1)) {
			accordionItems.push(
				<Accordion.Item
					{...accordionItemProps}
					key={g.group.id}
					value={g.group.id}
				>
					<Accordion.Control {...accordionControlProps}>
						{g.group.name}
					</Accordion.Control>
					<Accordion.Panel {...accordionPanelProps} key={g.group.id}>
						<Stack {...panelStackProps}>{g.elements}</Stack>
					</Accordion.Panel>
				</Accordion.Item>,
			);
			if (!mergeAccordions) {
				addAccordion(accordionItems, defaultValue);
				accordionItems = [];
			}
		} else {
			if (accordionItems.length > 0) {
				addAccordion(accordionItems, defaultValue);
				accordionItems = [];
			}
			elements.push(g.elements[0]);
		}
	});
	if (accordionItems.length > 0) {
		addAccordion(accordionItems, defaultValue);
	}

	return (
		<Stack {...wrapperStackProps}>
			{topSection}
			<Stack {...elementStackProps}>{elements}</Stack>
		</Stack>
	);
}
