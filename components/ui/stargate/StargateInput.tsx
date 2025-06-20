import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	Box,
	BoxProps,
	Button,
	ButtonProps,
	Loader,
	LoaderProps,
	MantineThemeComponent,
	Text,
	TextProps,
	useProps,
} from "@mantine/core";
import React from "react";
import Icon from "../Icon";

interface Props {
	icon: IconTypeEnum;
	color: string;
	isLoading?: boolean;
	isDisabled?: boolean;
	isBtnDisabled?: boolean;
	message?: string;
	onConnect?: (event: React.MouseEvent) => void;
}

interface StyleProps {
	boxProps?: BoxProps;
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

export default function StargateInput(props: Props & StyleProps) {
	const {buttonProps, loadingButtonProps, textProps, loaderProps} = useProps(
		"StargateInput",
		defaultStyleProps,
		props,
	);

	const {
		icon = IconTypeEnum.DeviceDesktopUp,
		color,
		message,
		onConnect,
		isLoading,
		isDisabled,
		isBtnDisabled,
	} = props;

	if (isLoading) {
		return (
			<Box>
				<Button
					{...loadingButtonProps}
					rightSection={<Loader {...loaderProps} />}
				>
					<Text {...textProps}>
						Waiting for selection in the client
					</Text>
				</Button>
			</Box>
		);
	}

	return (
		<Box>
			<Button
				{...buttonProps}
				color={color}
				disabled={isBtnDisabled || isLoading || isDisabled}
				rightSection={<Icon type={icon} />}
				onClick={onConnect}
			>
				{message}
			</Button>
		</Box>
	);
}
