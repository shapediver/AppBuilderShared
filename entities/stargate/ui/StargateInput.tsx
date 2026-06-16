import type {MantineButtonProps} from "@AppBuilderLib/shared/mantine-props/button";
import type {MantineLoaderProps} from "@AppBuilderLib/shared/mantine-props/loader";
import type {MantineTextProps} from "@AppBuilderLib/shared/mantine-props/text";
import Icon from "@AppBuilderLib/shared/ui/icon/Icon";
import {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {
	Button,
	Loader,
	MantineColor,
	MantineThemeComponent,
	Text,
	useProps,
} from "@mantine/core";
import React from "react";

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

/**
 * @docAttached
 * @category entity
 * @configPath themeOverrides.components.StargateInput.defaultProps
 * @displayName StargateInput
 */
export interface StargateInputStyleProps {
	buttonProps?: MantineButtonProps;
	loadingButtonProps?: MantineButtonProps;
	textProps?: MantineTextProps;
	loaderProps?: MantineLoaderProps;
}

const defaultStyleProps: Partial<StargateInputStyleProps> = {
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
	props: Partial<Props> & Partial<StargateInputStyleProps>,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * StargateInput component
 */
export default function StargateInput(props: Props & Partial<StargateInputStyleProps>) {
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
