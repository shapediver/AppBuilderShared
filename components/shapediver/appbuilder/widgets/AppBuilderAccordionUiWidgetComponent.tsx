import AppBuilderWidgetsComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderWidgetsComponent";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {IAppBuilderWidgetPropsAccordionUi} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	Accordion,
	AccordionControlProps,
	AccordionItemProps,
	AccordionPanelProps,
	AccordionProps,
	MantineThemeComponent,
	Stack,
	StackProps,
	useProps,
} from "@mantine/core";
import React, {useEffect, useState} from "react";

interface StyleProps {
	accordionProps?: AccordionProps;
	accordionItemProps?: Partial<AccordionItemProps>;
	accordionControlProps?: AccordionControlProps;
	accordionPanelProps?: AccordionPanelProps;
	stackProps?: StackProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	accordionProps: {},
	accordionPanelProps: {},
	accordionItemProps: {},
	accordionControlProps: {},
	stackProps: {},
};

type AppBuilderAccordionUiWidgetComponentThemePropsType = Partial<StyleProps>;

export function AppBuilderAccordionUiWidgetComponentThemeProps(
	props: AppBuilderAccordionUiWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

type Props = IAppBuilderWidgetPropsAccordionUi &
	AppBuilderAccordionUiWidgetComponentThemePropsType & {
		namespace: string;
	};

export default function AppBuilderAccordionUiWidgetComponent(props: Props) {
	const {namespace, items, multiple, defaultValue, value, ...styleProps} =
		props;

	const {
		accordionProps,
		accordionPanelProps,
		accordionItemProps,
		accordionControlProps,
		stackProps,
	} = useProps(
		"AppBuilderAccordionUiWidgetComponent",
		defaultStyleProps,
		styleProps,
	);

	// Local state for uncontrolled mode
	const [localValue, setLocalValue] = useState<
		string | string[] | null | undefined
	>(defaultValue || null);

	const handleValueChange = (newValue: string | string[] | null) => {
		// Update local state (uncontrolled mode)
		setLocalValue(newValue);
	};

	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	return (
		<Accordion
			value={localValue}
			multiple={multiple || false}
			{...accordionProps}
			onChange={handleValueChange}
		>
			{items.map((item, index) => (
				<Accordion.Item
					key={index}
					value={item.value || item.name}
					{...accordionItemProps}
				>
					<Accordion.Control
						icon={
							item.icon ? (
								<Icon iconType={item.icon} />
							) : undefined
						}
						title={item.tooltip}
						{...accordionControlProps}
					>
						{item.name}
					</Accordion.Control>
					<Accordion.Panel {...accordionPanelProps}>
						<Stack {...stackProps}>
							<AppBuilderWidgetsComponent
								namespace={namespace}
								widgets={item.widgets}
							/>
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>
			))}
		</Accordion>
	);
}
