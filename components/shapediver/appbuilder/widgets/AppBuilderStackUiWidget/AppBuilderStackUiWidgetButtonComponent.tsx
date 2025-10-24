import {
	Button,
	ButtonProps,
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
import React, {useContext, useState} from "react";
import Icon, {IconProps} from "~/shared/components/ui/Icon";
import TooltipWrapper from "~/shared/components/ui/TooltipWrapper";
import {AppBuilderStackContext} from "~/shared/context/StackContext";
import {IAppBuilderWidgetPropsStackUi} from "~/shared/types/shapediver/appbuilder";

export interface StyleProps {
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
};

type Props = IAppBuilderWidgetPropsStackUi &
	Partial<StyleProps> & {
		namespace: string;
	};

export default function AppBuilderStackUiWidgetButtonComponent(props: Props) {
	const {name, icon, tooltip, ...styleProps} = props;
	const [isOpen, setIsOpen] = useState(true);
	const {
		stackPaperProps,
		stackProps,
		itemTextProps,
		buttonForwardProps,
		iconForwardProps,
		transitionForwardProps,
	} = useProps(
		"AppBuilderStackUiWidgetComponent",
		defaultStyleProps,
		styleProps,
	);
	const stackContext = useContext(AppBuilderStackContext);
	const handleButtonClick = () => {
		setIsOpen(false);
		setTimeout(() => {
			stackContext.push(props);
			setIsOpen(true);
		}, transitionForwardProps?.duration ?? 300);
	};

	return (
		<Paper
			{...stackPaperProps}
			style={{
				...stackPaperProps?.style,
				overflowX: "hidden",
				overflowY: "hidden",
			}}
		>
			<Transition mounted={isOpen} {...transitionForwardProps}>
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
		</Paper>
	);
}
