import {AppBuilderStackContext} from "@AppBuilderLib/features/appbuilder/lib/StackContext";
import {Icon, IconProps} from "@AppBuilderLib/shared/ui/icon";
import {TooltipWrapper} from "@AppBuilderLib/shared/ui/tooltip";
import {
	Button,
	ButtonProps,
	Paper,
	PaperProps,
	Stack,
	StackProps,
	Text,
	TextProps,
	useProps,
} from "@mantine/core";
import React, {useContext} from "react";
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
		style: {backgroundColor: "var(--mantine-color-body)"},
	},
	stackProps: {gap: "xs"},
	itemTextProps: {size: "md", c: "var(--mantine-color-text)"},
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
};

type Props = IAppBuilderWidgetPropsStackUi &
	Partial<StyleProps> & {
		namespace: string;
	};

export default function AppBuilderStackUiWidgetButtonComponent(props: Props) {
	const {name, icon, tooltip, ...styleProps} = props;
	const {
		stackPaperProps,
		stackProps,
		itemTextProps,
		buttonForwardProps,
		iconForwardProps,
	} = useProps(
		"AppBuilderStackUiWidgetComponent",
		defaultStyleProps,
		styleProps,
	);
	const stackContext = useContext(AppBuilderStackContext);

	return (
		<Paper {...stackPaperProps}>
			<Stack {...stackProps}>
				<Button
					onClick={() => stackContext.push(props)}
					rightSection={
						<Icon
							{...iconForwardProps}
							iconType={
								iconForwardProps?.iconType ||
								"tabler:chevron-right"
							}
						/>
					}
					leftSection={icon ? <Icon iconType={icon} /> : undefined}
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
		</Paper>
	);
}
