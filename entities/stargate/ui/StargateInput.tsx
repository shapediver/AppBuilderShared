import {Icon, IconType} from "@AppBuilderLib/shared/ui/icon";
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
	textProps?: TextProps;
	loaderProps?: LoaderProps;
}

const defaultStyleProps: Partial<StyleProps> = {
	buttonProps: {
		variant: "outline",
		justify: "space-between",
		fullWidth: true,
		h: "60px",
		pr: "md",
	},
	textProps: {
		size: "xs",
	},
	loaderProps: {
		size: "xs",
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
 * StargateInput component
 */
export default function StargateInput(props: Props & StyleProps) {
	const {
		buttonProps,
		textProps,
		loaderProps,
		disabled,
		message,
		icon,
		color,
		onClick,
		isWaiting,
		waitingText,
	} = useProps("StargateInput", defaultStyleProps, props);

	const iconOrLoader = isWaiting ? (
		<Loader {...loaderProps} />
	) : (
		<Icon iconType={icon} size="1.5rem" />
	);

	return (
		<Button
			{...buttonProps}
			leftSection={
				<Text {...textProps}>{isWaiting ? waitingText : message}</Text>
			}
			rightSection={iconOrLoader}
			color={color}
			disabled={disabled}
			onClick={onClick}
		/>
	);
}
