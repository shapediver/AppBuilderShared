import {MantineStyleProp} from "@mantine/core";

export interface CommonButtonProps {
	size?: number;
	color?: string;
	colorDisabled?: string;
	variant?: string;
	variantDisabled?: string;
	iconStyle?: MantineStyleProp;
}

export const IconProps = {
	color: "black",
	colorDisabled: "grey",
	variant: "subtle",
	variantDisabled: "transparent",
	size: 32,
	style: {},
};
