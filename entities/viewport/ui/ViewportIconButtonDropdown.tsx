import {
	MantineThemeComponent,
	Menu,
	MenuDropdownProps,
	MenuProps,
	useProps,
} from "@mantine/core";
import React from "react";
import {
	CommonButtonProps,
	ViewportIconButtonDropdownSections,
	ViewportTransparentBackgroundStyle,
} from "../config";
import {useIconMenu} from "../model";
import ViewportIconButton, {
	ViewportIconButtonProps,
} from "./ViewportIconButton";

interface ViewportIconButtonDropdownProps extends CommonButtonProps {
	disabled?: boolean;
	sections: ViewportIconButtonDropdownSections;
	visible?: boolean;
	viewportIconButtonProps: ViewportIconButtonProps;
}

/**
 * @docAttached
 * @configPath themeOverrides.components.ViewportIconButtonDropdown.defaultProps
 * @displayName ViewportIconButtonDropdown
 */
export type ViewportIconButtonDropdownStyleProps = {
	menuProps?: MenuProps;
	menuDropdownProps?: MenuDropdownProps;
};

const defaultStyleProps: ViewportIconButtonDropdownStyleProps = {
	menuProps: {shadow: "md", position: "bottom-end"},
	menuDropdownProps: {style: ViewportTransparentBackgroundStyle},
};

type ViewportIconButtonDropdownThemePropsType =
	Partial<ViewportIconButtonDropdownStyleProps>;
export function ViewportIconButtonDropdownThemeProps(
	props: ViewportIconButtonDropdownThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ViewportIconButtonDropdown(
	props: ViewportIconButtonDropdownProps &
		Partial<ViewportIconButtonDropdownStyleProps>,
) {
	const {
		viewportIconButtonProps,
		disabled = false,
		visible = true,
		sections,
		...rest
	} = props;

	const {menuDropdownProps, menuProps} = useProps(
		"ViewportIconButtonDropdown",
		defaultStyleProps,
		rest,
	);

	const onClickOutside = () => setIsMenuOpened(false);
	const {menuRef, isMenuOpened, setIsMenuOpened} = useIconMenu(
		visible,
		onClickOutside,
	);

	const hasItems = sections.some((s) => s.length > 0);
	if (!hasItems) return null;

	return (
		<Menu
			{...menuProps}
			opened={visible && isMenuOpened}
			onChange={setIsMenuOpened}
		>
			<Menu.Target>
				<div>
					<ViewportIconButton
						{...viewportIconButtonProps}
						disabled={disabled}
						onClick={() => setIsMenuOpened(!isMenuOpened)}
					/>
				</div>
			</Menu.Target>
			<Menu.Dropdown ref={menuRef} {...menuDropdownProps}>
				{sections.map((section, i) => (
					<React.Fragment key={i}>
						{i > 0 && sections[i - 1].length > 0 && (
							<Menu.Divider />
						)}
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
