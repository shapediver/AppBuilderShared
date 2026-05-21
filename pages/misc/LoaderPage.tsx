import {
	Center,
	Loader,
	LoaderProps,
	MantineThemeComponent,
	useProps,
} from "@mantine/core";
import React from "react";
import type {LoaderPageThemeDefaultProps} from "./LoaderPage.types";

interface Props {
	/** error message */
	children?: React.ReactNode;
}

const defaultStyleProps = {
	type: "oval",
	size: "md",
} as const satisfies LoaderPageThemeDefaultProps;

type LoaderPageThemePropsType = Partial<LoaderPageThemeDefaultProps>;

export function LoaderPageThemeProps(
	props: LoaderPageThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Full screen alert page
 *
 * @returns
 */
export default function LoaderPage(props: Props & LoaderProps) {
	const {children, ...rest} = props;
	const restDefault = useProps("LoaderPage", defaultStyleProps, rest);

	return (
		<Center w="100vw" h="100vh">
			<Loader {...restDefault}>{children}</Loader>
		</Center>
	);
}
