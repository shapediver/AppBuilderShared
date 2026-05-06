import {
	Group,
	MantineSpacing,
	MantineThemeComponent,
	StyleProp,
	useProps,
} from "@mantine/core";
import React from "react";

interface Props {
	children?: React.ReactNode;
	style?: StyleProp<React.CSSProperties>;
}

/**
 * @docAttached
 * @configPath themeOverrides.components.AppBuilderHorizontalContainer.defaultProps
 * @displayName AppBuilderHorizontalContainer
 */
export interface StyleProps {
	/**
	 * Group width
	 * @default "100%"
	 */
	w: StyleProp<React.CSSProperties["width"]>;
	/**
	 * Group height
	 * @default "100%"
	 */
	h: StyleProp<React.CSSProperties["width"]>;
	/**
	 * Flex justify-content
	 * @default "center"
	 */
	justify: React.CSSProperties["justifyContent"];
	/**
	 * Flex wrap
	 * @default "nowrap"
	 */
	wrap: React.CSSProperties["flexWrap"];
	/**
	 * Padding (Mantine spacing)
	 * @default "xs"
	 */
	p: StyleProp<MantineSpacing>;
}

const defaultStyleProps: StyleProps = {
	w: "100%",
	h: "100%",
	justify: "center",
	wrap: "nowrap",
	p: "xs",
};

export type AppBuilderHorizontalContainerThemePropsType = Partial<StyleProps>;

export function AppBuilderHorizontalContainerThemeProps(
	props: AppBuilderHorizontalContainerThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Vertical container for AppBuilder
 * @param props
 * @returns
 */
export default function AppBuilderHorizontalContainer(
	props: Props & Partial<StyleProps>,
) {
	const {children, ...rest} = useProps(
		"AppBuilderHorizontalContainer",
		defaultStyleProps,
		props,
	);

	return <Group {...rest}>{children}</Group>;
}
