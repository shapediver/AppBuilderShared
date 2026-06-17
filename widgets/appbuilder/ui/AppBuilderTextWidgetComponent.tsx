import {IAppBuilderWidgetPropsText} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {AppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import MarkdownWidgetComponent from "@AppBuilderLib/shared/ui/markdown/MarkdownWidgetComponent";
import {
	MantineStyleProp,
	MantineThemeComponent,
	Paper,
	Text,
	useProps,
} from "@mantine/core";
import React, {useContext} from "react";

/**
 * Text / markdown widget wrapped in Mantine `Paper`. Theme `defaultProps` follow {@link MantinePaperProps}.
 *
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderTextWidgetComponent.defaultProps
 * @displayName AppBuilderTextWidgetComponent
 */
export interface AppBuilderTextWidgetComponentStyleProps extends MantinePaperProps {}

const defaultStyleProps: Partial<AppBuilderTextWidgetComponentStyleProps> = {};

type AppBuilderTextWidgetThemePropsType =
	Partial<AppBuilderTextWidgetComponentStyleProps>;

export function AppBuilderTextWidgetThemeProps(
	props: AppBuilderTextWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderTextWidgetComponent(
	props: IAppBuilderWidgetPropsText & AppBuilderTextWidgetThemePropsType,
) {
	const {text, markdown, ...rest} = props;

	const themeProps = useProps(
		"AppBuilderTextWidgetComponent",
		defaultStyleProps,
		rest,
	);

	const context = useContext(AppBuilderContainerContext);

	const styleProps: MantineStyleProp = {};
	if (context.orientation === "horizontal") {
		styleProps.height = "100%";
	} else if (context.orientation === "vertical") {
		styleProps.overflowX = "auto";
	}

	if (text) {
		return (
			<Paper {...themeProps} style={styleProps}>
				<Text>{text}</Text>
			</Paper>
		);
	} else if (markdown) {
		return (
			<Paper {...themeProps} style={styleProps}>
				<MarkdownWidgetComponent>{markdown}</MarkdownWidgetComponent>
			</Paper>
		);
	}

	return <></>;
}
