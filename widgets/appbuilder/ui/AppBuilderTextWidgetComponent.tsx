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
 * Documented subset of Mantine `Paper` props for the text/markdown wrapper.
 * Theme and props still accept any Paper prop via {@link AppBuilderTextWidgetThemePropsInput}.
 *
 * @docAttached
 * @configPath themeOverrides.components.AppBuilderTextWidgetComponent.defaultProps
 * @displayName AppBuilderTextWidgetComponent
 */
export interface AppBuilderTextWidgetComponentStyleProps {
	p?: PaperProps["p"];
	px?: PaperProps["px"];
	py?: PaperProps["py"];
	pt?: PaperProps["pt"];
	pb?: PaperProps["pb"];
	pl?: PaperProps["pl"];
	pr?: PaperProps["pr"];
	m?: PaperProps["m"];
	mx?: PaperProps["mx"];
	my?: PaperProps["my"];
	mt?: PaperProps["mt"];
	mb?: PaperProps["mb"];
	ml?: PaperProps["ml"];
	mr?: PaperProps["mr"];
	shadow?: PaperProps["shadow"];
	radius?: PaperProps["radius"];
	withBorder?: PaperProps["withBorder"];
	styles?: PaperProps["styles"];
	classNames?: PaperProps["classNames"];
	style?: PaperProps["style"];
	bg?: PaperProps["bg"];
	bd?: PaperProps["bd"];
	w?: PaperProps["w"];
	h?: PaperProps["h"];
	miw?: PaperProps["miw"];
	mih?: PaperProps["mih"];
	maw?: PaperProps["maw"];
	mah?: PaperProps["mah"];
	display?: PaperProps["display"];
	hiddenFrom?: PaperProps["hiddenFrom"];
	visibleFrom?: PaperProps["visibleFrom"];
	opacity?: PaperProps["opacity"];
}

/** Full Mantine Paper surface for theme defaults and widget props. */
export type AppBuilderTextWidgetThemePropsInput = Partial<PaperProps>;

const defaultStyleProps: AppBuilderTextWidgetThemePropsInput = {};

export function AppBuilderTextWidgetThemeProps(
	props: AppBuilderTextWidgetThemePropsInput,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderTextWidgetComponent(
	props: IAppBuilderWidgetPropsText & AppBuilderTextWidgetThemePropsInput,
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
