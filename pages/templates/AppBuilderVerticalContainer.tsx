import {
	MantineThemeComponent,
	Stack,
	StyleProp,
	useProps,
} from "@mantine/core";
import React from "react";
import type {AppBuilderVerticalContainerThemeDefaultProps} from "shared/pages/config/AppBuilderVerticalContainer.types";

interface Props {
	children?: React.ReactNode;
	style?: StyleProp<React.CSSProperties>;
}

const defaultStyleProps = {
	p: "xs",
} as const satisfies AppBuilderVerticalContainerThemeDefaultProps;

export type AppBuilderVerticalContainerThemePropsType =
	Partial<AppBuilderVerticalContainerThemeDefaultProps>;

export function AppBuilderVerticalContainerThemeProps(
	props: AppBuilderVerticalContainerThemePropsType,
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
export default function AppBuilderVerticalContainer(
	props: Props & Partial<AppBuilderVerticalContainerThemeDefaultProps>,
) {
	const {children, ...rest} = useProps(
		"AppBuilderVerticalContainer",
		defaultStyleProps,
		props,
	);

	return <Stack {...rest}>{children}</Stack>;
}
