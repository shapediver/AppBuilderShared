import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ViewportIconsOptionalProps} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {ActionIcon, Group, Portal, Stack, useProps} from "@mantine/core";
import {
	HTMLElementAnchorCustomData,
	HTMLElementAnchorData,
	sceneTree,
	TAG3D_JUSTIFICATION,
} from "@shapediver/viewer.session";
import {vec2, vec3} from "gl-matrix";
import React, {ReactNode, useEffect, useId, useRef, useState} from "react";
import classes from "./ViewportIcons.module.css";
interface Props {
	allowPointerEvents?: boolean;
	location: number[];
	justification?: TAG3D_JUSTIFICATION;

	element?: JSX.Element | ReactNode;
	previewIcon?: IconTypeEnum;
}
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

const anchors: {
	[key: string]: React.Dispatch<React.SetStateAction<boolean>>;
} = {};

export default function ViewportAnchor(
	props: Props & Partial<ViewportIconsOptionalProps>,
) {
	const {
		allowPointerEvents,
		justification,
		location,
		element,
		previewIcon,
		...rest
	} = props;

	const {viewportId} = useViewportId();

	const {color, iconStyle, size, variant} = useProps(
		"ViewportIcons",
		defaultProps,
		rest,
	);

	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);

	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
	const [canvasWidth, setCanvasWidth] = useState<number>(0);
	const [canvasHeight, setCanvasHeight] = useState<number>(0);
	const [showPreviewIcon, setShowPreviewIcon] =
		useState<boolean>(!!previewIcon);
	const id = useId();
	anchors[id] = setShowPreviewIcon;

	const showPreviewIconRef = useRef(showPreviewIcon);
	useEffect(() => {
		viewport?.render();
		showPreviewIconRef.current = showPreviewIcon;
	}, [showPreviewIcon]);

	useEffect(() => {
		if (viewport?.canvas) setCanvas(viewport.canvas);
	}, [viewport]);

	useEffect(() => {
		if (!canvas) return;
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const {width, height} = entry.contentRect;
				setCanvasWidth(width);
				setCanvasHeight(height);
			}
		});
		observer.observe(canvas);

		// Set initial size
		setCanvasWidth(canvas.offsetWidth);
		setCanvasHeight(canvas.offsetHeight);

		return () => observer.disconnect();
	}, [canvas]);

	const portalRef = React.useRef<HTMLDivElement>(null);
	const controlElementGroupRef = React.useRef<HTMLDivElement>(null);

	/**
	 * We need to observe the portalRef for changes in size
	 * to ensure that the viewport is re-rendered when the size changes.
	 * This is necessary because only then the update function will be called
	 * and the position of the portal will be updated accordingly.
	 */
	useEffect(() => {
		if (!portalRef.current) return;
		const observer = new ResizeObserver(() => {
			viewport?.render();
		});
		observer.observe(portalRef.current);

		return () => observer.disconnect();
	}, [portalRef.current, viewport]);

	useEffect(() => {
		const create = () => {
			if (!portalRef.current) return;
			portalRef.current.style.display = "block";
		};

		// the update function that is called on every render call
		// you can do anything here
		const update = (properties: {
			anchor: HTMLElementAnchorData;
			htmlElement: HTMLDivElement;
			page: vec2;
			container: vec2;
			client: vec2;
			scale: vec2;
			hidden: boolean;
		}) => {
			if (!portalRef.current) return;
			// first letter is vertical
			const vertical = showPreviewIconRef.current
				? "M"
				: justification?.[0] || "M";
			// second letter is horizontal
			const horizontal = showPreviewIconRef.current
				? "C"
				: justification?.[1] || "C";

			const offsetWidth = portalRef.current.offsetWidth;
			// we adjust the offsetHeight to ignore the height of the control element group
			// this is necessary to ensure that the portal is positioned correctly
			const offsetHeight =
				portalRef.current.offsetHeight +
				(controlElementGroupRef.current?.offsetHeight || 0);

			let x, y;
			if (horizontal === "R") {
				x =
					properties.container[0] * (1 / properties.scale[0]) -
					offsetWidth;
			} else if (horizontal === "L") {
				x = properties.container[0] * (1 / properties.scale[0]);
			} else {
				x =
					properties.container[0] * (1 / properties.scale[0]) -
					offsetWidth / 2;
			}

			if (vertical === "B") {
				y = properties.container[1] * (1 / properties.scale[1]);
			} else if (vertical === "T") {
				y =
					properties.container[1] * (1 / properties.scale[1]) -
					offsetHeight;
			} else {
				y =
					properties.container[1] * (1 / properties.scale[1]) -
					offsetHeight / 2;
			}

			portalRef.current.style.left = x + "px";
			portalRef.current.style.top = y + "px";
		};

		const anchorData = new HTMLElementAnchorCustomData({
			location: vec3.fromValues(location[0], location[1], location[2]),
			data: {},
			create,
			update,
		});
		sceneTree.root.addData(anchorData);
		sceneTree.root.updateVersion();

		return () => {
			sceneTree.root.removeData(anchorData);
			sceneTree.root.updateVersion();
		};
	}, [location, justification]);

	const onAnchorClick = () => {
		setShowPreviewIcon((prev) => {
			if (prev) {
				Object.keys(anchors).forEach((key) => {
					if (key !== id) {
						anchors[key](true);
					}
				});
				return false;
			} else {
				return true;
			}
		});
		viewport?.render();
	};

	const previewIconElement = (
		<TooltipWrapper label="Open Element">
			<div>
				<ActionIcon
					onClick={onAnchorClick}
					size={size}
					variant={variant}
					aria-label="Open Element"
					style={iconStyle}
				>
					<Icon
						type={previewIcon!}
						color={color}
						className={classes.viewportIcon}
					/>
				</ActionIcon>
			</div>
		</TooltipWrapper>
	);

	const closeIconElement = (
		<Group
			style={{
				display: "flex",
				justifyContent: "flex-end",
				width: "100%",
				pointerEvents: "auto",
			}}
		>
			<ActionIcon
				onClick={onAnchorClick}
				size="sm"
				variant={variant}
				style={iconStyle}
			>
				<Icon
					type={IconTypeEnum.X}
					color={color}
					className={classes.viewportIcon}
				/>
			</ActionIcon>
		</Group>
	);

	return (
		canvas && (
			<Portal target={canvas.parentElement || undefined}>
				<Group
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: canvasWidth,
						height: canvasHeight,
						pointerEvents: "none",
						overflow: "hidden",
					}}
				>
					<Group
						ref={portalRef}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
						}}
					>
						<Group
							color="inherit"
							style={{
								pointerEvents:
									allowPointerEvents === false &&
									showPreviewIcon === false
										? "none"
										: "auto",
							}}
						>
							{showPreviewIcon ? (
								previewIconElement
							) : (
								<Stack gap={0}>
									<Group ref={controlElementGroupRef}>
										{closeIconElement}
									</Group>
									<Group
										style={{
											width: "var(--app-shell-navbar-width)",
											backgroundColor:
												"var(--mantine-color-default)",
											borderRadius:
												"var(--mantine-radius-md)",
										}}
									>
										<div style={{width: "100%"}}>
											{element}
										</div>
									</Group>
								</Stack>
							)}
						</Group>
					</Group>
				</Group>
			</Portal>
		)
	);
}
