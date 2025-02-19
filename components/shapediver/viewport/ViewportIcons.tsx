import React, {useState} from "react";
import {
	ActionIcon,
	Loader,
	Menu,
	Modal,
	Text,
	useProps,
	Box,
} from "@mantine/core";
import {FLAG_TYPE} from "@shapediver/viewer.session";
import classes from "./ViewportIcons.module.css";
import {
	ViewportIconsOptionalProps,
	ViewportIconsProps,
} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useClickEventHandler} from "@AppBuilderShared/hooks/misc/useClickEventHandler";
import {isIPhone} from "@AppBuilderShared/utils/misc/navigator";
import {useFullscreen} from "@AppBuilderShared/hooks/ui/useFullscreen";
import {firstLetterUppercase} from "@AppBuilderShared/utils/misc/strings";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import Icon from "@AppBuilderShared/components/ui/Icon";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";

const defaultProps: ViewportIconsOptionalProps = {
	color: "black",
	colorDisabled: "grey",
	enableArBtn: true,
	enableCamerasBtn: true,
	enableFullscreenBtn: true,
	enableZoomBtn: true,
	fullscreenId: "viewer-fullscreen-area",
	iconStyle: {m: "3px"},
	size: 32,
	style: {display: "flex"},
	variant: "subtle",
	variantDisabled: "transparent",
};

export default function ViewportIcons(
	props: ViewportIconsProps & Partial<ViewportIconsOptionalProps>,
) {
	const {viewportId: _viewportId, ...rest} = props;
	const {
		color,
		colorDisabled,
		enableArBtn,
		enableCamerasBtn,
		enableFullscreenBtn,
		enableZoomBtn,
		fullscreenId,
		iconStyle,
		size,
		style,
		variant,
		variantDisabled,
	} = useProps("ViewportIcons", defaultProps, rest);
	const {viewportId: defaultViewportId} = useViewportId();
	const viewportId = _viewportId ?? defaultViewportId;

	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);

	const isArEnabled = viewport ? viewport.enableAR : false;
	const isViewableInAr = viewport ? viewport.viewableInAR() : false;
	const [arLink, setArLink] = useState("");
	const [isArLoading, setIsArLoading] = useState(false);
	const [isModalArOpened, setIsModalArOpened] = useState(false);
	const [isModalArError, setIsModalArError] = useState("");

	const onViewInARDesktopLinkRequest = async () => {
		setIsModalArError("");
		setArLink("");

		if (!viewport) return;

		try {
			setIsModalArOpened(true);
			setIsArLoading(true);
			const arLink = await viewport.createArSessionLink();
			setArLink(arLink);
		} catch (e: any) {
			setIsModalArError("Error while creating QR code");
			console.error(e);
		} finally {
			setIsArLoading(false);
		}
	};

	const onArClick = async () => {
		if (!viewport) return;

		if (isViewableInAr) {
			const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
			if (viewport.viewableInAR()) await viewport.viewInAR();
			viewport.removeFlag(token);
		} else {
			await onViewInARDesktopLinkRequest();
		}
	};

	const onZoomClick = () => {
		if (!viewport || !viewport.camera) return;

		viewport.camera.zoomTo();
	};

	const onZoomDoubleClick = () => {
		if (!viewport || !viewport.camera) return;

		viewport.camera.reset({});
	};

	const {clickEventHandler: zoomClickHandler} = useClickEventHandler(
		onZoomClick,
		onZoomDoubleClick,
	);

	const isFullscreenDisabled = !enableFullscreenBtn || isIPhone();

	const {makeElementFullscreen, isFullScreenAvailable} =
		useFullscreen(fullscreenId);

	const cameras = enableCamerasBtn && viewport ? viewport.cameras : {};
	const noCamerasAvailable = Object.keys(cameras).length === 0;

	const [isCamerasMenuOpened, setIsCamerasMenuOpened] = useState(false);

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
		<Box style={style}>
			{enableArBtn && isArEnabled && (
				<TooltipWrapper label="View in AR">
					<div>
						<ActionIcon
							onClick={onArClick}
							disabled={isArLoading}
							size={size}
							variant={isViewableInAr ? variantDisabled : variant}
							aria-label="View in AR"
							style={iconStyle}
						>
							<Icon
								type={IconTypeEnum.AugmentedReality}
								color={isArLoading ? colorDisabled : color}
								className={classes.viewportIcon}
							/>
						</ActionIcon>
					</div>
				</TooltipWrapper>
			)}

			{enableArBtn && (
				<Modal
					opened={isModalArOpened}
					onClose={() => setIsModalArOpened(false)}
					title="Scan the code"
					centered
				>
					{isModalArError ? (
						<Text c="red">{isModalArError}</Text>
					) : (
						<>
							<Text>
								Scan the QR code below using your mobile device
								to see the model in AR. The code is compatible
								with Android and iOS devices.
							</Text>
							<section className={classes.containerAr}>
								{isArLoading ? (
									<section className={classes.loaderAr}>
										<Loader color="blue" />
									</section>
								) : (
									<img
										src={arLink}
										height="180px"
										alt="ar_link"
									/>
								)}
							</section>
						</>
					)}
				</Modal>
			)}

			{enableZoomBtn && (
				<TooltipWrapper label="Zoom extents">
					<ActionIcon
						onClick={zoomClickHandler}
						size={size}
						variant={variant}
						aria-label="Zoom extents"
						style={iconStyle}
					>
						<Icon type={IconTypeEnum.ZoomIn} color={color} className={classes.viewportIcon} />
					</ActionIcon>
				</TooltipWrapper>
			)}

			{enableFullscreenBtn && (
				<TooltipWrapper label="Fullscreen">
					<ActionIcon
						onClick={makeElementFullscreen}
						disabled={
							isFullscreenDisabled ||
							!isFullScreenAvailable.current
						}
						size={size}
						variant={
							isFullscreenDisabled ||
							!isFullScreenAvailable.current
								? variantDisabled
								: variant
						}
						aria-label="Fullscreen"
						style={iconStyle}
					>
						<Icon
							type={IconTypeEnum.Maximize}
							color={
								isFullscreenDisabled ||
								!isFullScreenAvailable.current
									? colorDisabled
									: color
							}
							className={classes.viewportIcon}
						/>
					</ActionIcon>
				</TooltipWrapper>
			)}

			{enableCamerasBtn && (
				<Menu
					opened={isCamerasMenuOpened}
					onChange={setIsCamerasMenuOpened}
					shadow="md"
					width={200}
					position={"bottom-end"}
				>
					<ActionIcon
						onClick={() =>
							setIsCamerasMenuOpened(!isCamerasMenuOpened)
						}
						disabled={noCamerasAvailable}
						size={size}
						variant={noCamerasAvailable ? variantDisabled : variant}
						aria-label="Cameras"
						style={iconStyle}
					>
						<TooltipWrapper
							disabled={isCamerasMenuOpened}
							label="Cameras"
						>
							<Menu.Target>
								<Icon type={IconTypeEnum.Video} className={classes.viewportIcon} color={color} />
							</Menu.Target>
						</TooltipWrapper>
					</ActionIcon>
					<Menu.Dropdown>{cameraElements}</Menu.Dropdown>
				</Menu>
			)}
		</Box>
	);
}
