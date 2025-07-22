import {
	Box,
	Button,
	Divider,
	Group,
	MantineThemeComponent,
	Modal,
	ModalProps,
	Stack,
	useProps,
} from "@mantine/core";
import React, {ReactNode} from "react";

interface Props {
	/**
	 * Whether the modal is opened
	 */
	opened: boolean;
	/**
	 * Modal title
	 */
	title?: string;
	/**
	 * Whether the modal is in loading state
	 */
	isLoading?: boolean;
	/**
	 * Cancel button title
	 */
	cancelBtnTitle?: string;
	/**
	 * Whether to hide the confirm button
	 */
	hideConfirmBtn?: boolean;
	/**
	 * Whether to hide the cancel button
	 */
	hideCancelBtn?: boolean;
	/**
	 * Whether the confirm button is disabled
	 */
	isConfirmBtnDisabled?: boolean;
	/**
	 * Whether the cancel button is disabled
	 */
	isCancelBtnDisabled?: boolean;
	/**
	 * Confirm button title
	 */
	confirmBtnTitle?: string;
	/**
	 * Whether the modal is persistent (cannot be closed by clicking outside or ESC)
	 */
	persistent?: boolean;
	/**
	 * Content to display in the modal body
	 */
	children?: ReactNode;
	/**
	 * Additional buttons to display before the cancel/confirm buttons
	 */
	additionalButtons?: ReactNode;
	/**
	 * Callback when the modal should be closed
	 */
	onClose: () => void;
	/**
	 * Callback when confirm is clicked
	 */
	onConfirm?: () => void;
	/**
	 * Callback when cancel is clicked
	 */
	onCancel?: () => void;
}

type StyleProps = ModalProps & {
	/**
	 * Modal size
	 */
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	/**
	 * Close button props for styling
	 */
	closeButtonProps?: Record<string, any>;
	/**
	 * Gap for the main stack container
	 */
	stackGap?: string;
	/**
	 * Gap for button groups (both additional and action buttons)
	 */
	groupGap?: string;
	/**
	 * Props for the button container group
	 */
	buttonContainerProps?: {
		justify?: string;
		align?: string;
	};
	/**
	 * Props for the cancel button
	 */
	cancelButtonProps?: Record<string, any>;
	/**
	 * Props for the confirm button
	 */
	confirmButtonProps?: Record<string, any>;
};

export type ModalBaseProps = Props & Partial<StyleProps>;

/**
 * Default style properties for the modal.
 */
const defaultStyleProps: Partial<StyleProps> = {
	size: "xl",
	centered: true,
	closeButtonProps: {
		size: "md",
	},
	stackGap: "sm",
	groupGap: "sm",
	buttonContainerProps: {
		justify: "space-between",
		align: "center",
	},
	cancelButtonProps: {
		variant: "default",
	},
	confirmButtonProps: {
		variant: "filled",
	},
};

type ModalBaseThemePropsType = Partial<StyleProps>;

export function ModalBaseThemeProps(
	props: ModalBaseThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Modal base component that provides flexible content and button configuration.
 * Replicates the functionality of the Vue/Vuetify SdModal component.
 */
export default function ModalBase(props: Props & Partial<StyleProps>) {
	const {
		opened,
		title = "",
		isLoading = false,
		cancelBtnTitle = "Cancel",
		hideConfirmBtn = false,
		hideCancelBtn = false,
		isConfirmBtnDisabled = false,
		isCancelBtnDisabled = false,
		confirmBtnTitle = "Confirm",
		persistent = false,
		children,
		additionalButtons,
		onClose,
		onConfirm,
		onCancel,
		...rest
	} = props;

	const styleProps = useProps("UniversalModal", defaultStyleProps, rest);
	const {
		stackGap,
		groupGap,
		buttonContainerProps,
		cancelButtonProps,
		confirmButtonProps,
		...modalStyleProps
	} = styleProps;

	const handleClose = () => {
		if (persistent && isLoading) return;
		onClose();
	};

	const handleConfirm = () => {
		if (onConfirm) {
			onConfirm();
		}
	};

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		} else {
			onClose();
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Escape" && !persistent) {
			handleClose();
		}
	};

	return (
		<Modal
			{...modalStyleProps}
			opened={opened}
			onClose={persistent ? () => {} : handleClose}
			title={title}
			closeOnClickOutside={!persistent}
			closeOnEscape={!persistent}
			onKeyDown={handleKeyDown}
			{...rest}
		>
			<Stack gap={stackGap}>
				<Divider />
				{children && <Box>{children}</Box>}
				<Divider />
				<Group {...buttonContainerProps}>
					<Group gap={groupGap}>{additionalButtons}</Group>
					<Group gap={groupGap}>
						{!hideCancelBtn && (
							<Button
								{...cancelButtonProps}
								onClick={handleCancel}
								disabled={isLoading || isCancelBtnDisabled}
								loading={isLoading && isCancelBtnDisabled}
							>
								{cancelBtnTitle}
							</Button>
						)}

						{!hideConfirmBtn && (
							<Button
								{...confirmButtonProps}
								onClick={handleConfirm}
								disabled={isLoading || isConfirmBtnDisabled}
								loading={isLoading && !isConfirmBtnDisabled}
							>
								{confirmBtnTitle}
							</Button>
						)}
					</Group>
				</Group>
			</Stack>
		</Modal>
	);
}
