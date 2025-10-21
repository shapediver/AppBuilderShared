import AppBuilderWidgetsComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderWidgetsComponent";
import Icon, {IconProps} from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IAppBuilderWidgetPropsStackUi} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	Box,
	BoxProps,
	Button,
	ButtonProps,
	Collapse,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Stack,
	StackProps,
	Text,
	TextProps,
	Transition,
	TransitionProps,
	useProps,
} from "@mantine/core";
import React, {useState} from "react";

interface StyleProps {
	/**
	 * Props for the Paper component wrapping the stack.
	 */
	stackPaperProps?: PaperProps;
	/**
	 * Props for the Stack component containing buttons.
	 */
	stackProps?: StackProps;
	/**
	 * Props for the icon on the right of the stack buttons.
	 */
	iconForwardProps?: IconProps;
	/**
	 * Props for the text of the stack buttons.
	 */
	itemTextProps?: TextProps;
	/**
	 * Props for stack buttons.
	 */
	buttonForwardProps?: ButtonProps;
	/**
	 * Props for the forward transition.
	 */
	transitionForwardProps?: Partial<TransitionProps>;
	/**
	 * Props for the back button.
	 */
	buttonBackProps?: ButtonProps;
	/**
	 * Props for the icon on the left of the back button.
	 */
	iconBackProps?: IconProps;
	/**
	 * Props for the back transition.
	 */
	transitionBackProps?: Partial<TransitionProps>;
	/**
	 * Props for the content Stack.
	 */
	contentStackProps?: StackProps;
	/**
	 * Props for the content Box.
	 */
	stackContentProps?: BoxProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	stackPaperProps: {
		px: 0,
		py: 0,
		withBorder: false,
		shadow: "md",
		style: {backgroundColor: "var(--mantine-color-gray-0)"},
	},
	stackProps: {gap: "xs"},
	itemTextProps: {size: "md"},
	buttonForwardProps: {
		justify: "space-between",
		fullWidth: true,
		size: "lg",
		px: "md",
		variant: "default",
	},
	iconForwardProps: {
		size: 18,
		iconType: "tabler:chevron-right",
	},
	transitionForwardProps: {
		transition: "slide-left",
		duration: 300,
		timingFunction: "ease",
	},
	buttonBackProps: {
		mt: "xs",
		ml: "xs",
		variant: "subtle",
	},
	iconBackProps: {
		size: 18,
		iconType: "tabler:chevron-left",
	},
	transitionBackProps: {
		transition: "slide-right",
		duration: 300,
		timingFunction: "ease",
	},
	stackContentProps: {
		pb: "xs",
		px: "xs",
	},
};

type AppBuilderStackUiWidgetComponentThemePropsType = Partial<StyleProps>;

export function AppBuilderStackUiWidgetComponentThemeProps(
	props: AppBuilderStackUiWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

type Props = IAppBuilderWidgetPropsStackUi &
	AppBuilderStackUiWidgetComponentThemePropsType & {
		namespace: string;
	};

export default function AppBuilderStackUiWidgetComponent(props: Props) {
	const {namespace, widgets, name, icon, tooltip, ...styleProps} = props;

	const {
		stackPaperProps,
		stackProps,
		itemTextProps,
		buttonForwardProps,
		iconForwardProps,
		transitionForwardProps,
		buttonBackProps,
		iconBackProps,
		transitionBackProps,
		stackContentProps,
	} = useProps(
		"AppBuilderStackUiWidgetComponent",
		defaultStyleProps,
		styleProps,
	);

	const [isOpen, setIsOpen] = useState(false);
	const handleButtonClick = () => {
		setIsOpen(true);
	};

	const handleBackClick = () => {
		setIsOpen(false);
	};

	return (
		<Paper
			{...stackPaperProps}
			style={{
				...stackPaperProps?.style,
				position: !isOpen ? "relative" : "absolute",
				inset: 0,
				height: !isOpen ? "auto" : "100%",
				width: "100%",
				zIndex: !isOpen ? undefined : 1000,
				overflowX: "hidden",
				overflowY: !isOpen ? "hidden" : "auto",
			}}
		>
			<Transition mounted={!isOpen} {...transitionForwardProps}>
				{(styles) => (
					<Stack {...stackProps} style={styles}>
						<Button
							onClick={() => handleButtonClick()}
							rightSection={
								<Icon
									{...iconForwardProps}
									iconType={
										iconForwardProps?.iconType ||
										"tabler:chevron-right"
									}
								/>
							}
							leftSection={
								icon ? <Icon iconType={icon} /> : undefined
							}
							{...buttonForwardProps}
							style={{
								position: !isOpen ? "relative" : "absolute", // Escape height shift when collapsing
							}}
						>
							<Text {...itemTextProps}>
								{tooltip ? (
									<TooltipWrapper label={tooltip}>
										<div>{name}</div>
									</TooltipWrapper>
								) : (
									name
								)}
							</Text>
						</Button>
					</Stack>
				)}
			</Transition>

			<Stack>
				<Transition mounted={isOpen} {...transitionBackProps}>
					{(styles) => (
						<Box style={styles}>
							<Button
								onClick={handleBackClick}
								leftSection={
									<Icon
										{...iconBackProps}
										iconType={
											iconBackProps?.iconType ||
											"tabler:chevron-left"
										}
									/>
								}
								{...buttonBackProps}
							>
								Back
							</Button>
						</Box>
					)}
				</Transition>
				<Collapse in={isOpen}>
					<Transition mounted={isOpen} {...transitionBackProps}>
						{(styles) => (
							<Box style={{...{styles}, height: "100%"}}>
								<Stack
									{...stackContentProps}
									style={{
										...{"--paper-shadow": "none"},
										...(stackContentProps?.style || {}),
									}}
								>
									<AppBuilderWidgetsComponent
										namespace={namespace}
										widgets={widgets}
									/>
								</Stack>
							</Box>
						)}
					</Transition>
				</Collapse>
			</Stack>
		</Paper>
	);
}
