import {Box, Group} from "@mantine/core";
import type {ReactNode} from "react";
import ParameterResetButton from "./ParameterResetButton";

interface ParameterResetRowProps {
	show: boolean;
	onClick: () => void;
	disabled?: boolean;
	/** When true (default), the control grows; reset sits at the row end. */
	grow?: boolean;
	children: ReactNode;
}

/**
 * When `show`, wrap the control with a sibling reset button.
 * When hidden, children render unchanged.
 */
export default function ParameterResetRow({
	show,
	onClick,
	disabled,
	grow = true,
	children,
}: ParameterResetRowProps) {
	if (!show) return children;

	return (
		<Group wrap="nowrap">
			{grow ? (
				<Box style={{flex: 1, minWidth: 0}}>{children}</Box>
			) : (
				children
			)}
			<ParameterResetButton onClick={onClick} disabled={disabled} />
		</Group>
	);
}
