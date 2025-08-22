import {
	Button,
	ButtonProps,
	Loader,
	LoaderProps,
	MantineColor,
	MantineThemeComponent,
	Text,
	TextProps,
	useProps,
} from "@mantine/core";
import React from "react";
import Icon, {IconType} from "../../ui/Icon";

interface Props {
	/** Icon to display on the right section of the button */
	icon: IconType;
	/** Color to use for the button */
	color: MantineColor;
	/** Indicates whether we are waiting for a desktop client action to complete */
	isWaiting?: boolean;
	/** The text to show while waiting for a desktop client action to complete */
	waitingText: string;
	/** Controls the disabled state of the button */
	disabled?: boolean;
	/** The message to show in the button */
	message?: string;
	/** Button click handler */
	onClick?: (event: React.MouseEvent) => void;
}

interface StyleProps {
	buttonProps?: ButtonProps;
	loadingButtonProps?: ButtonProps;
	textProps?: TextProps;
	loaderProps?: LoaderProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	buttonProps: {
		variant: "filled",
		fullWidth: true,
		justify: "space-between",
	},
	loadingButtonProps: {
		disabled: true,
		fullWidth: true,
		justify: "space-between",
		style: {
			backgroundColor: "transparent",
		},
	},
	textProps: {
		size: "sm",
		c: "dimmed",
		fs: "italic",
	},
	loaderProps: {
		type: "dots",
		size: "sm",
	},
};

export function StargateInputThemeProps(
	props: Partial<Props> & Partial<StyleProps>,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Functional component representing Stargate inputs and outputs.
 * @param props
 * @returns
 */
export default function StargateInput(props: Props & StyleProps) {
	const {buttonProps, loadingButtonProps, textProps, loaderProps} = useProps(
		"StargateInput",
		defaultStyleProps,
		props,
	);

	const {icon, color, message, onClick, isWaiting, waitingText, disabled} =
		props;

	if (isWaiting) {
		return (
			<Button
				{...loadingButtonProps}
				rightSection={<Loader {...loaderProps} />}
			>
				<Text {...textProps}>{waitingText}</Text>
			</Button>
		);
	}

	return (
		<Button
			{...buttonProps}
			color={color}
			disabled={disabled}
			rightSection={<Icon iconType={icon} />}
			onClick={onClick}
		>
			{message}
		</Button>
	);
}
