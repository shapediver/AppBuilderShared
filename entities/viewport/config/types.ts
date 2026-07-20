import {IconType} from "@AppBuilderLib/shared/ui/icon/Icon.types";
import {MantineStyleProp} from "@mantine/core";

export interface CommonButtonProps {
	size?: number;
	color?: string;
	colorDisabled?: string;
	variant?: string;
	variantDisabled?: string;
	iconStyle?: MantineStyleProp;
	label?: string;
	tooltip?: string;
	iconType?: IconType;
}

export const IconProps = {
	color: "var(--mantine-color-default-color)",
	colorDisabled: "var(--mantine-color-disabled-color)",
	variant: "subtle",
	variantDisabled: "transparent",
	size: 32,
	style: {
		margin: "0",
	},
};
