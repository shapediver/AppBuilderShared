import {
	Group,
	MantineThemeComponent,
	StyleProp,
	useProps,
} from "@mantine/core";
import React from "react";
import type {AppBuilderHorizontalContainerThemeDefaultProps} from "shared/pages/config/AppBuilderHorizontalContainer.types";

interface Props {
	children?: React.ReactNode;
	style?: StyleProp<React.CSSProperties>;
}

const defaultStyleProps = {
	w: "100%",
	h: "100%",
	justify: "center",
	wrap: "nowrap",
	p: "xs",
} as const satisfies AppBuilderHorizontalContainerThemeDefaultProps;

export type AppBuilderHorizontalContainerThemePropsType =
	Partial<AppBuilderHorizontalContainerThemeDefaultProps>;

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
	props: Props & Partial<AppBuilderHorizontalContainerThemeDefaultProps>,
) {
	const {children, ...rest} = useProps(
		"AppBuilderHorizontalContainer",
		defaultStyleProps,
		props,
	);

	return <Group {...rest}>{children}</Group>;
}
