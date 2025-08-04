import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import useIconMenu from "@AppBuilderShared/hooks/shapediver/viewer/icons/useIconMenu";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ViewportTransparentBackgroundStyle} from "@AppBuilderShared/types/shapediver/viewport";
import {firstLetterUppercase} from "@AppBuilderShared/utils/misc/strings";
import {ActionIcon, Menu, MenuDropdownProps} from "@mantine/core";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React from "react";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconProps} from "./types";

interface CamerasButtonProps extends CommonButtonProps {
	viewport?: IViewportApi;
	menuDropdownProps?: MenuDropdownProps;
	visible?: boolean;
}

export default function CamerasButton({
	viewport,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
	menuDropdownProps = {
		style: ViewportTransparentBackgroundStyle,
	},
	visible = true,
}: CamerasButtonProps) {
	const cameras = viewport ? viewport.cameras : {};
	const noCamerasAvailable = Object.keys(cameras).length === 0;
	const onCameraSelect = (cameraId: string) => {
		if (!viewport) return;
		viewport.assignCamera(cameraId);
	};

	const onClickOutside = () => {
		setIsMenuOpened(false);
	};

	const {menuRef, isMenuOpened, setIsMenuOpened} = useIconMenu(
		visible,
		onClickOutside,
	);

	const cameraElements = Object.values(cameras).map((camera, i) => {
		return (
			<Menu.Item onClick={() => onCameraSelect(camera.id)} key={i}>
				{firstLetterUppercase(camera.name || camera.id)}
			</Menu.Item>
		);
	});

	return (
		<Menu
			opened={visible && isMenuOpened}
			onChange={setIsMenuOpened}
			shadow="md"
			position={"bottom-end"}
		>
			<ActionIcon
				onClick={() => setIsMenuOpened(!isMenuOpened)}
				disabled={noCamerasAvailable}
				size={size}
				variant={noCamerasAvailable ? variantDisabled : variant}
				aria-label="Cameras"
				style={iconStyle}
				className={classes.ViewportIcon}
			>
				<TooltipWrapper disabled={isMenuOpened} label="Cameras">
					<Menu.Target>
						<Icon
							type={IconTypeEnum.Video}
							color={noCamerasAvailable ? colorDisabled : color}
						/>
					</Menu.Target>
				</TooltipWrapper>
			</ActionIcon>
			<Menu.Dropdown ref={menuRef} {...menuDropdownProps}>
				{cameraElements}
			</Menu.Dropdown>
		</Menu>
	);
}
