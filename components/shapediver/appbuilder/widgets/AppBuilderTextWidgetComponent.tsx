import React, { useContext } from "react";
import { MantineStyleProp, MantineThemeComponent, Paper, PaperProps, Text, useProps } from "@mantine/core";
import { IAppBuilderWidgetPropsText } from "../../../../types/shapediver/appbuilder";
import MarkdownWidgetComponent from "../../ui/MarkdownWidgetComponent";
import { AppBuilderContainerContext } from "../../../../context/AppBuilderContext";

type StylePros = PaperProps;

const defaultStyleProps : Partial<StylePros> = {
};

type AppBuilderTextWidgetThemePropsType = Partial<StylePros>;

export function AppBuilderTextWidgetThemeProps(props: AppBuilderTextWidgetThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function AppBuilderTextWidgetComponent(props: IAppBuilderWidgetPropsText & AppBuilderTextWidgetThemePropsType) {
	
	const { text, markdown, ...rest } = props;

	const themeProps = useProps("AppBuilderTextWidgetComponent", defaultStyleProps, rest);
	
	const context = useContext(AppBuilderContainerContext);

	const styleProps: MantineStyleProp = {};
	if (context.orientation === "horizontal") {
		styleProps.height = "100%";
	}
	styleProps.fontWeight = "100";
	
	if (text) {
		return <Paper {...themeProps} style={styleProps}><Text>
			{ text }
		</Text></Paper>;
	}
	else if (markdown) {
		return <Paper {...themeProps} style={styleProps}>
			<MarkdownWidgetComponent>
				{ markdown }
			</MarkdownWidgetComponent>
		</Paper>;
	}

	return <></>;
}
