import {IAppBuilderWidgetPropsAccordionUi} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {MantineAccordionProps} from "@AppBuilderLib/shared/mantine-props/accordion";
import type {MantineAccordionControlProps} from "@AppBuilderLib/shared/mantine-props/accordionControl";
import type {MantineAccordionItemProps} from "@AppBuilderLib/shared/mantine-props/accordionItem";
import type {MantineAccordionPanelProps} from "@AppBuilderLib/shared/mantine-props/accordionPanel";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import type {MantineStackProps} from "@AppBuilderLib/shared/mantine-props/stack";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import TooltipWrapper from "@AppBuilderLib/shared/ui/tooltip/TooltipWrapper";
import {
	Accordion,
	MantineThemeComponent,
	Paper,
	Stack,
	useProps,
} from "@mantine/core";
import {useEffect, useState} from "react";
import AppBuilderWidgetsComponent from "./AppBuilderWidgetsComponent";

/**
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderAccordionUiWidgetComponent.defaultProps
 * @displayName AppBuilderAccordionUiWidgetComponent
 */
export interface AppBuilderAccordionUiWidgetComponentStyleProps {
	accordionProps?: MantineAccordionProps;
	/**
	 * Props for the Paper component wrapping each accordion.
	 */
	accordionPaperProps?: MantinePaperProps;
	accordionItemProps?: MantineAccordionItemProps;
	accordionControlProps?: MantineAccordionControlProps;
	accordionPanelProps?: MantineAccordionPanelProps;
	stackProps?: MantineStackProps;
}

const defaultStyleProps: Partial<AppBuilderAccordionUiWidgetComponentStyleProps> =
	{
		accordionProps: {},
		accordionPaperProps: {px: 0, py: 0, withBorder: false, shadow: "md"},
		accordionPanelProps: {},
		accordionItemProps: {},
		accordionControlProps: {},
		stackProps: {},
	};

type AppBuilderAccordionUiWidgetComponentThemePropsType =
	Partial<AppBuilderAccordionUiWidgetComponentStyleProps>;

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
		accordionPaperProps,
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
	>(
		multiple === false && Array.isArray(defaultValue)
			? defaultValue.length > 0
				? defaultValue[0]
				: null
			: defaultValue || null,
	);

	const handleValueChange = (newValue: string | string[] | null) => {
		// Update local state (uncontrolled mode)
		setLocalValue(newValue);
	};

	useEffect(() => {
		if (value !== undefined) {
			if (multiple === false && Array.isArray(value)) {
				setLocalValue(value.length > 0 ? value[0] : null);
			} else {
				setLocalValue(value);
			}
		}
	}, [value]);

	return (
		<Paper {...accordionPaperProps}>
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
							{item.tooltip ? (
								<TooltipWrapper label={item.tooltip}>
									<div>{item.name}</div>
								</TooltipWrapper>
							) : (
								item.name
							)}
						</Accordion.Control>
						<Accordion.Panel {...accordionPanelProps}>
							<Stack
								style={{"--paper-shadow": "none"}} // remove shadow propagation from child Papers
								{...stackProps}
							>
								<AppBuilderWidgetsComponent
									namespace={namespace}
									widgets={item.widgets}
								/>
							</Stack>
						</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
		</Paper>
	);
}
