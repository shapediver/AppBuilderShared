import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ActionIcon, Loader, Modal, Text, Title} from "@mantine/core";
import {FLAG_TYPE} from "@shapediver/viewer.session";
import {IViewportApi} from "@shapediver/viewer.viewport";
import React, {useState} from "react";
import classes from "../ViewportIcons.module.css";
import {CommonButtonProps, IconProps} from "./types";

interface ArButtonProps extends CommonButtonProps {
	viewport?: IViewportApi;
}

export default function ArButton({
	viewport,
	size = undefined,
	color = IconProps.color,
	colorDisabled = IconProps.colorDisabled,
	variant = IconProps.variant,
	variantDisabled = IconProps.variantDisabled,
	iconStyle = IconProps.style,
}: ArButtonProps) {
	const [isModalArOpened, setIsModalArOpened] = useState(false);
	const [arLink, setArLink] = useState("");
	const [isArLoading, setIsArLoading] = useState(false);
	const [isModalArError, setIsModalArError] = useState("");

	const isViewableInAr = viewport ? viewport.viewableInAR() : false;

	const onViewInARDesktopLinkRequest = async () => {
		setIsModalArError("");
		setArLink("");

		if (!viewport) return;

		try {
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
		}
	};

	const handleArClick = async () => {
		if (isViewableInAr) {
			await onArClick();
		} else {
			await onViewInARDesktopLinkRequest();
			setIsModalArOpened(true);
		}
	};

	return (
		<>
			<TooltipWrapper label="View in AR">
				<ActionIcon
					onClick={handleArClick}
					disabled={isArLoading}
					className={classes.ViewportIcon}
					size={size}
					variant={isViewableInAr ? variantDisabled : variant}
					aria-label="View in AR"
					style={iconStyle}
				>
					<Icon
						type={IconTypeEnum.AugmentedReality}
						color={isArLoading ? colorDisabled : color}
					/>
				</ActionIcon>
			</TooltipWrapper>

			<Modal
				opened={isModalArOpened}
				onClose={() => setIsModalArOpened(false)}
				title={<Title>Scan the code</Title>}
				centered
			>
				{isModalArError ? (
					<Text c="red">{isModalArError}</Text>
				) : (
					<>
						<Text>
							Scan the QR code below using your mobile device to
							see the model in AR. The code is compatible with
							Android and iOS devices.
						</Text>
						<section className={classes.containerAr}>
							{isArLoading ? (
								<section className={classes.loaderAr}>
									<Loader />
								</section>
							) : (
								<img
									src={arLink}
									height="180px"
									alt="Augment reality"
								/>
							)}
						</section>
					</>
				)}
			</Modal>
		</>
	);
}
