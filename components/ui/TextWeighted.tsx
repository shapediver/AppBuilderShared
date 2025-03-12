import {PolymorphicComponentProps, Text, TextProps} from "@mantine/core";
import React, {useMemo} from "react";
import classes from "./TextWeighted.module.css";

type FontWeight = "thin" | "light" | "normal" | "medium" | "bold";

type TextComponentProps<C = "p"> = PolymorphicComponentProps<C, TextProps>;

export default function TextWeighted(
	props: TextComponentProps & {
		/**
		 * Default font weight to use. Default weight values can be configured using the theme. See theme.other.defaultFontWeight*.
		 */
		fontWeight: FontWeight;
	},
) {
	const {fontWeight, className, fw, ...rest} = props;

	const fwClass = useMemo(() => {
		switch (fontWeight) {
			case "thin":
				return classes.thin;
			case "light":
				return classes.light;
			case "normal":
				return classes.normal;
			case "medium":
				return classes.medium;
			case "bold":
				return classes.bold;
		}
	}, [fontWeight]);

	return (
		<Text
			{...rest}
			className={
				fw ? className : className ? `${fwClass} ${className}` : fwClass
			}
			fw={fw}
		/>
	);
}
