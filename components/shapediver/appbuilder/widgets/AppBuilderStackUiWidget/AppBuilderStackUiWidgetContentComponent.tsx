import {
	Box,
	BoxProps,
	Button,
	ButtonProps,
	Paper,
	PaperProps,
	Stack,
	StackProps,
	Transition,
	TransitionProps,
	useProps,
} from "@mantine/core";
import React, {useContext, useState} from "react";
import AppBuilderWidgetsComponent from "~/shared/components/shapediver/appbuilder/widgets/AppBuilderWidgetsComponent";
import Icon, {IconProps} from "~/shared/components/ui/Icon";
import {AppBuilderStackContext} from "~/shared/context/StackContext";
import {IAppBuilderWidgetPropsStackUi} from "~/shared/types/shapediver/appbuilder";

export interface StyleProps {
	/**
	 * Props for the Paper component wrapping the stack.
	 */
	stackPaperProps?: PaperProps;
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
type Props = IAppBuilderWidgetPropsStackUi &
	AppBuilderStackUiWidgetComponentThemePropsType & {
		namespace: string;
	};

export default function AppBuilderStackUiWidgetContentComponent(props: Props) {
	const {namespace, widgets, ...styleProps} = props;
	const [isOpen, setIsOpen] = useState(true);
	const {
		stackPaperProps,
		buttonBackProps,
		iconBackProps,
		transitionBackProps,
		stackContentProps,
	} = useProps(
		"AppBuilderStackUiWidgetComponent",
		defaultStyleProps,
		styleProps,
	);

	const stackContext = useContext(AppBuilderStackContext);

	const handleBackClick = () => {
		setIsOpen(false);
		setTimeout(() => {
			stackContext.pop();
			setIsOpen(true);
		}, transitionBackProps?.duration ?? 300);
	};

	return (
		<Paper
			{...stackPaperProps}
			style={{
				...stackPaperProps?.style,
				position: "absolute",
				inset: 0,
				height: "100%",
				width: "100%",
			}}
		>
			<Transition mounted={isOpen} {...transitionBackProps}>
				{(styles) => (
					<Stack style={styles}>
						<Box>
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
						<Box style={{height: "100%"}}>
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
					</Stack>
				)}
			</Transition>
		</Paper>
	);
}
