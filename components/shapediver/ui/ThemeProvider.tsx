import {
	CSSProperties,
	MantineTheme,
	MantineThemeProvider,
	MantineThemeProviderProps,
} from "@mantine/core";
import React from "react";

/**
 * Provide a mantine theme override and also override mantine CSS variables which are based on the theme.
 * For a complete list of Mantine CSS variables @see https://mantine.dev/styles/css-variables-list/
 * @param props
 * @returns
 */
export default function ThemeProvider(props: MantineThemeProviderProps) {
	const {theme, children, ...rest} = props;

	const style: CSSProperties = {
		/** Make sure we use exactly the size and position of our parent */
		display: "contents",
		/** Heading font sizes */
		...(
			Object.keys(theme?.headings?.sizes ?? {}) as Array<
				keyof MantineTheme["headings"]["sizes"]
			>
		).reduce(
			(acc, level) => {
				const fontSize = theme?.headings?.sizes?.[level]?.fontSize;
				if (fontSize) acc[`--mantine-${level}-font-size`] = fontSize;
				return acc;
			},
			{} as Record<string, string>,
		),
		/** General font sizes */
		...Object.keys(theme?.fontSizes ?? {}).reduce(
			(acc, level) => {
				const fontSize = theme?.fontSizes?.[level];
				if (fontSize) acc[`--mantine-font-size-${level}`] = fontSize;
				return acc;
			},
			{} as Record<string, string>,
		),
		/** TODO extend by further variables as required */
	};

	return (
		<div style={style}>
			<MantineThemeProvider theme={theme} {...rest}>
				{children}
			</MantineThemeProvider>
		</div>
	);
}
