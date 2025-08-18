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
	color: "var(--mantine-color-default-color)",
	colorDisabled: "var(--mantine-color-disabled-color)",
	variant: "subtle",
	variantDisabled: "transparent",
	size: 32,
	style: {},
};

/**
 * Dropdown item and sections model for unified viewport icon menus.
 */
export interface ViewportIconButtonDropdownItem {
	name: string;
	onClick: () => void;
	iconType?: string;
	disabled?: boolean;
}

export type ViewportIconButtonDropdownSections =
	ViewportIconButtonDropdownItem[][];
