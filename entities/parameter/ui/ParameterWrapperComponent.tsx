import React, {createContext, useState} from "react";
import classes from "./ParameterWrapperComponent.module.css";

/**
 * Slot at the end of a parameter control. Inline Accept/Reject buttons portal
 * here so they belong to the control that queued the change.
 */
export const ParameterAcceptRejectSlotContext =
	createContext<HTMLElement | null>(null);

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
	const [slot, setSlot] = useState<HTMLElement | null>(null);

	return React.createElement(
		component,
		{
			...(onCancel ? {className: classes.wrapperModified} : {}),
			...rest,
		},
		<ParameterAcceptRejectSlotContext.Provider value={slot}>
			{children}
			<div ref={setSlot} style={{display: "contents"}} />
		</ParameterAcceptRejectSlotContext.Provider>,
	);
}
