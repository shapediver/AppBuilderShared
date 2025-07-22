import ModalBase, {
	ModalBaseProps,
} from "@AppBuilderShared/components/ui/ModalBase";
import {
	NumberInput,
	NumberInputProps,
	Stack,
	StackProps,
	Text,
	TextProps,
} from "@mantine/core";
import React from "react";

interface Props {
	/**
	 * Modal title
	 */
	title: string;
	/**
	 * Text above the number input (prompt)
	 */
	prompt?: string;
	/**
	 * Modal base props
	 */
	modalBaseProps?: ModalBaseProps;
	/**
	 * Properties of the Mantine number input
	 */
	numberInputProps?: NumberInputProps;
	/**
	 * Properties of the Mantine stack
	 */
	stackProps?: StackProps;
	/**
	 * Properties of the Mantine text
	 */
	textProps?: TextProps;
}

export default function NumberInputModal({
	title,
	prompt,
	numberInputProps = {},
	modalBaseProps = {
		opened: false,
		confirmBtnTitle: "Save",
		cancelBtnTitle: "Cancel",
		onClose: () => {},
	},
	stackProps = {
		gap: "md",
	},
	textProps = {
		size: "sm",
		c: "dimmed",
	},
}: Props) {
	return (
		<ModalBase {...modalBaseProps} title={title}>
			<Stack {...stackProps}>
				{prompt && <Text {...textProps}>{prompt}</Text>}
				<NumberInput {...numberInputProps} />
			</Stack>
		</ModalBase>
	);
}
