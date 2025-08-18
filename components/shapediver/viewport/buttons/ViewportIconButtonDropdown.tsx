import useIconMenu from "@AppBuilderShared/hooks/shapediver/viewer/icons/useIconMenu";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {Menu, MenuDropdownProps} from "@mantine/core";
import React from "react";
import ViewportIconButton from "./ViewportIconButton";
import {
	CommonButtonProps,
	IconProps,
	ViewportIconButtonDropdownSections,
} from "./types";

interface ViewportIconButtonDropdownProps extends CommonButtonProps {
	iconType: string;
	tooltip?: string;
	disabled?: boolean;
	sections: ViewportIconButtonDropdownSections;
	menuDropdownProps?: MenuDropdownProps;
	visible?: boolean;
}

export default function ViewportIconButtonDropdown({
	iconType,
	tooltip,
	disabled = false,
	sections,
	menuDropdownProps = {style: ViewportTransparentBackgroundStyle},
	visible = true,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: ViewportIconButtonDropdownProps) {
	const onClickOutside = () => setIsMenuOpened(false);
	const {menuRef, isMenuOpened, setIsMenuOpened} = useIconMenu(
		visible,
		onClickOutside,
	);

	const hasItems = sections.some((s) => s.length > 0);
	if (!hasItems) return null;

	return (
		<Menu
			shadow="md"
			position="bottom-end"
			opened={visible && isMenuOpened}
			onChange={setIsMenuOpened}
		>
			<Menu.Target>
				<div>
					<ViewportIconButton
						iconType={iconType}
						tooltip={tooltip ?? "Menu"}
						disabled={disabled}
						size={size}
						color={color}
						colorDisabled={colorDisabled}
						variant={variant}
						variantDisabled={variantDisabled}
						iconStyle={iconStyle}
						onClick={() => setIsMenuOpened(!isMenuOpened)}
					/>
				</div>
			</Menu.Target>
			<Menu.Dropdown ref={menuRef} {...menuDropdownProps}>
				{sections.map((section, i) => (
					<React.Fragment key={i}>
						{i > 0 && <Menu.Divider />}
						{section.map((item, j) => (
							<Menu.Item
								key={`${i}-${j}`}
								onClick={item.onClick}
								disabled={item.disabled}
							>
								{item.name}
							</Menu.Item>
						))}
					</React.Fragment>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}
