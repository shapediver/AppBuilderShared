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
	const {namespace, items, ...styleProps} = props;

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

	const [activeItem, setActiveItem] = useState<number | null>(null);
	const handleButtonClick = (index: number) => {
		setActiveItem(index);
	};

	const handleBackClick = () => {
		setActiveItem(null);
	};

	return (
		<Paper {...stackPaperProps}>
			<Transition
				mounted={activeItem === null}
				{...transitionForwardProps}
			>
				{(styles) => (
					<Stack {...stackProps} style={styles}>
						{items.map((item, index) => (
							<Button
								key={index}
								onClick={() => handleButtonClick(index)}
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
									item.icon ? (
										<Icon iconType={item.icon} />
									) : undefined
								}
								{...buttonForwardProps}
								style={{
									position:
										activeItem === null
											? "relative"
											: "absolute", // Escape height shift when collapsing
								}}
							>
								<Text {...itemTextProps}>
									{item.tooltip ? (
										<TooltipWrapper label={item.tooltip}>
											<div>{item.name}</div>
										</TooltipWrapper>
									) : (
										item.name
									)}
								</Text>
							</Button>
						))}
					</Stack>
				)}
			</Transition>

			{items.map((item, index) => (
				<Stack key={index}>
					<Transition
						mounted={activeItem === index}
						{...transitionBackProps}
					>
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
					<Collapse in={activeItem === index}>
						<Transition
							mounted={activeItem === index}
							{...transitionBackProps}
						>
							{(styles) => (
								<Box style={styles}>
									<Stack
										{...stackContentProps}
										style={{
											...{"--paper-shadow": "none"},
											...(stackContentProps?.style || {}),
										}}
									>
										<AppBuilderWidgetsComponent
											namespace={namespace}
											widgets={item.widgets}
										/>
									</Stack>
								</Box>
							)}
						</Transition>
					</Collapse>
				</Stack>
			))}
		</Paper>
	);
}
