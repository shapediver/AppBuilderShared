import useIconMenu from "@AppBuilderShared/hooks/shapediver/viewer/icons/useIconMenu";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {
	MantineThemeComponent,
	Menu,
	MenuDropdownProps,
	useProps,
} from "@mantine/core";
import React from "react";
import ViewportIconButton, {
	ViewportIconButtonProps,
} from "./ViewportIconButton";
import {CommonButtonProps, ViewportIconButtonDropdownSections} from "./types";

interface ViewportIconButtonDropdownProps extends CommonButtonProps {
	disabled?: boolean;
	sections: ViewportIconButtonDropdownSections;
	visible?: boolean;
	viewportIconButtonProps: ViewportIconButtonProps;
}

export type StyleProps = {
	menuDropdownProps?: MenuDropdownProps;
};

const defaultStyleProps: StyleProps = {
	menuDropdownProps: {style: ViewportTransparentBackgroundStyle},
};

type ViewportIconButtonDropdownThemePropsType = Partial<StyleProps>;
export function ViewportIconButtonDropdownThemeProps(
	props: ViewportIconButtonDropdownThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ViewportIconButtonDropdown(
	props: ViewportIconButtonDropdownProps & StyleProps,
) {
	const {
		viewportIconButtonProps,
		disabled = false,
		visible = true,
		sections,
		...rest
	} = props;

	const {menuDropdownProps} = useProps(
		"ViewportIconButtonDropdowns",
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
			shadow="md"
			position="bottom-end"
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
