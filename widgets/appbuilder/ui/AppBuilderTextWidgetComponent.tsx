import {
	AppBuilderContainerContext,
	IAppBuilderWidgetPropsText,
} from "@AppBuilderLib/features/appbuilder";
import {MarkdownWidgetComponent} from "@AppBuilderLib/shared/ui/markdown";
import {
	MantineStyleProp,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Text,
	useProps,
} from "@mantine/core";
import React, {useContext} from "react";

/**
 * Text / markdown widget wrapped in Mantine `Paper`. Theme `defaultProps` follow `PaperProps`.
 *
 * @docAttached
 * @configPath themeOverrides.components.AppBuilderTextWidgetComponent.defaultProps
 * @displayName AppBuilderTextWidgetComponent
 * @docLink https://mantine.dev/core/paper/?t=props
 */
export type AppBuilderTextWidgetComponentStyleProps = PaperProps;

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
