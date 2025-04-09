import React from "react";
import classes from "./ParameterWrapperComponent.module.css";

interface Props {
	children: React.ReactNode;
	onCancel?: () => void;
	component?:
		| string
		| React.ComponentType<any>
		| keyof React.JSX.IntrinsicElements;
	[key: string]: any;
}
/**
 * Functional component that creates a wrapper for parameter components
 * and changes background color based on onCancel property.
 */
export default function ParameterWrapperComponent(props: Props) {
	const {children, onCancel, component = "section", ...rest} = props;

	return React.createElement(
		component,
		{
			...(onCancel ? {className: classes.wrapperModified} : {}),
			...rest,
		},
		children,
	);
}
