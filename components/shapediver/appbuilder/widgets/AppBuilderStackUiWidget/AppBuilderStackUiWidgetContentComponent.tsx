import {
	Box,
	BoxProps,
	Button,
	ButtonProps,
	Paper,
	PaperProps,
	Stack,
	StackProps,
	useProps,
} from "@mantine/core";
import React, {useContext} from "react";
import AppBuilderWidgetsComponent from "~/shared/components/shapediver/appbuilder/widgets/AppBuilderWidgetsComponent";
import Icon, {IconProps} from "~/shared/components/ui/Icon";
import {AppBuilderStackContext} from "~/shared/context/StackContext";
import {useStackContext} from "~/shared/hooks/context/useStackContext";
import {IAppBuilderWidgetPropsStackUi} from "~/shared/types/shapediver/appbuilder";
import AppBuilderStackUiWidgetComponent from "./AppBuilderStackUiWidgetComponent";

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
		style: {backgroundColor: "var(--mantine-color-body)"},
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
	const {stackPaperProps, buttonBackProps, iconBackProps, stackContentProps} =
		useProps(
			"AppBuilderStackUiWidgetComponent",
			defaultStyleProps,
			styleProps,
		);

	const parentStackContext = useContext(AppBuilderStackContext);

	const {
		push: nestedPush,
		pop: nestedPop,
		animationDuration,
		isTransitioning: isNestedTransitioning,
		setIsTransitioning: setIsNestedTransitioning,
		currentStackElement: currentNestedStackElement,
	} = useStackContext(parentStackContext.animationDuration);

	return (
		<Paper
			{...stackPaperProps}
			style={{
				...stackPaperProps?.style,
				height: "100%",
				width: "100%",
			}}
		>
			<Stack>
				<Box>
					<Button
						onClick={() => parentStackContext.pop()}
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
					<AppBuilderStackContext.Provider
						value={{
							push: nestedPush,
							pop: nestedPop,
							animationDuration,
							isTransitioning: isNestedTransitioning,
							setIsTransitioning: setIsNestedTransitioning,
						}}
					>
						<AppBuilderStackUiWidgetComponent
							namespace={namespace}
							stackElement={currentNestedStackElement}
						>
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
						</AppBuilderStackUiWidgetComponent>
					</AppBuilderStackContext.Provider>
				</Box>
			</Stack>
		</Paper>
	);
}
