import {IAppBuilderWidgetPropsStackUi} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderStackContext} from "@AppBuilderLib/features/appbuilder/lib/StackContext";
import {useStackContext} from "@AppBuilderLib/features/appbuilder/model/useStackContext";
import type {MantineBoxProps} from "@AppBuilderLib/shared/mantine-props/box";
import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import type {MantineStackProps} from "@AppBuilderLib/shared/mantine-props/stack";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {IconProps} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {Box, Button, Paper, Stack, useProps} from "@mantine/core";
import {useContext} from "react";
import AppBuilderWidgetsComponent from "../AppBuilderWidgetsComponent";
import AppBuilderStackUiWidgetComponent from "./AppBuilderStackUiWidgetComponent";
import {
	stackBodySlotStyle,
	stackColumnStyle,
	stackPaperStyle,
} from "@AppBuilderLib/features/appbuilder/lib/stackLayout";

export interface StyleProps {
	/**
	 * Props for the Paper component wrapping the stack.
	 */
	stackPaperProps?: MantinePaperProps;
	/**
	 * Props for the back button.
	 */
	buttonBackProps?: MantineButtonProps;
	/**
	 * Props for the icon on the left of the back button.
	 */
	iconBackProps?: IconProps;
	/**
	 * Props for the content Stack.
	 */
	contentStackProps?: MantineStackProps;
	/**
	 * Props for the content Box.
	 */
	stackContentProps?: MantineBoxProps;
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
	const nestedStack = useStackContext(parentStackContext.animationDuration);

	return (
		<Paper
			{...stackPaperProps}
			style={{
				...stackPaperProps?.style,
				...stackPaperStyle,
			}}
		>
			<Stack style={stackColumnStyle}>
				<Box style={{flexShrink: 0}}>
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
				<Box style={stackBodySlotStyle}>
					<AppBuilderStackContext.Provider
						value={nestedStack.context}
					>
						<AppBuilderStackUiWidgetComponent
							namespace={namespace}
							stackPath={nestedStack.stackPath}
							liveWidgets={widgets}
							fallbackScrolls
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
