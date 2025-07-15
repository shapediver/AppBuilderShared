import {MantineStyleProp} from "@mantine/core";

export interface CommonButtonProps {
	size?: number;
	color?: string;
	colorDisabled?: string;
	variant?: string;
	variantDisabled?: string;
	iconStyle?: MantineStyleProp;
}

export const IconSize = 32;
export const IconColor = "black";
export const IconColorDisabled = "grey";
export const IconVariant = "subtle";
export const IconVariantDisabled = "transparent";
