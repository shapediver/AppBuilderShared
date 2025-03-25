import {PolymorphicComponentProps, Text, TextProps} from "@mantine/core";
import React, {forwardRef, useMemo} from "react";
import classes from "./TextWeighted.module.css";

type FontWeight = "thin" | "light" | "normal" | "medium" | "bold";

export type TextWeightedProps = TextProps & {
	/**
	 * Default font weight to use. Default weight values can be configured using the theme. See theme.other.defaultFontWeight*.
	 */
	fontWeight?: FontWeight;
};

type Props<C = "p"> = PolymorphicComponentProps<C, TextWeightedProps>;

const TextWeighted = forwardRef<HTMLParagraphElement, Props>(
	function TextWeighted(props: Props, ref) {
		const {fontWeight = "normal", className, fw, ...rest} = props;

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
					fw
						? className
						: className
							? `${fwClass} ${className}`
							: fwClass
				}
				fw={fw}
				ref={ref}
			/>
		);
	},
);

export default TextWeighted;
