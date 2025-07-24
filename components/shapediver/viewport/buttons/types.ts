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
	color: "var(--mantine-color-text)",
	colorDisabled: "var(--mantine-color-dimmed)",
	variant: "subtle",
	variantDisabled: "transparent",
	size: 32,
	style: {},
};
