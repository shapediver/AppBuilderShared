import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {firstLetterUppercase} from "@AppBuilderShared/utils/misc/strings";
import {ActionIcon, Menu} from "@mantine/core";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React, {useState} from "react";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconProps} from "./types";

interface CamerasButtonProps extends CommonButtonProps {
	viewport?: IViewportApi;
}

export default function CamerasButton({
	viewport,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: CamerasButtonProps) {
	const [isCamerasMenuOpened, setIsCamerasMenuOpened] = useState(false);
	const cameras = viewport ? viewport.cameras : {};
	const noCamerasAvailable = Object.keys(cameras).length === 0;

	const onCameraSelect = (cameraId: string) => {
		if (!viewport) return;
		viewport.assignCamera(cameraId);
	};

	const cameraElements = Object.values(cameras).map((camera, i) => {
		return (
			<Menu.Item onClick={() => onCameraSelect(camera.id)} key={i}>
				{firstLetterUppercase(camera.name || camera.id)}
			</Menu.Item>
		);
	});

	return (
		<Menu
			opened={isCamerasMenuOpened}
			onChange={setIsCamerasMenuOpened}
			shadow="md"
			width={200}
			position={"bottom-end"}
		>
			<ActionIcon
				onClick={() => setIsCamerasMenuOpened(!isCamerasMenuOpened)}
				disabled={noCamerasAvailable}
				size={size}
				variant={noCamerasAvailable ? variantDisabled : variant}
				aria-label="Cameras"
				style={iconStyle}
			>
				<TooltipWrapper disabled={isCamerasMenuOpened} label="Cameras">
					<Menu.Target>
						<Icon
							type={IconTypeEnum.Video}
							color={noCamerasAvailable ? colorDisabled : color}
							className={classes.viewportIcon}
						/>
					</Menu.Target>
				</TooltipWrapper>
			</ActionIcon>
			<Menu.Dropdown>{cameraElements}</Menu.Dropdown>
		</Menu>
	);
}
