import Icon from "@AppBuilderShared/components/ui/Icon";
import TooltipWrapper from "@AppBuilderShared/components/ui/TooltipWrapper";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAnchors} from "@AppBuilderShared/store/useShapeDiverStoreViewportAnchors";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {ViewportIconsOptionalProps} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {ActionIcon, Group, Portal, Stack, useProps} from "@mantine/core";
import {
	HTMLElementAnchorCustomData,
	IHTMLElementAnchorUpdateProperties,
	sceneTree,
	TAG3D_JUSTIFICATION,
} from "@shapediver/viewer.session";
import {vec3} from "gl-matrix";
import React, {
	ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import classes from "./ViewportIcons.module.css";
interface Props {
	allowPointerEvents?: boolean;
	location: number[] | vec3;
	justification?: TAG3D_JUSTIFICATION;
	element?: JSX.Element | ReactNode;
	previewIcon?: IconTypeEnum;
	id: string;
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

export default function ViewportAnchor(
	props: Props & Partial<ViewportIconsOptionalProps>,
) {
	const {
		allowPointerEvents,
		id,
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

	const {anchors, addViewportAnchor, removeViewportAnchor, updateDistance} =
		useShapeDiverStoreViewportAnchors((state) => ({
			anchors: state.anchors,
			addViewportAnchor: state.addAnchor,
			removeViewportAnchor: state.removeAnchor,
			updateDistance: state.updateDistance,
		}));

	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
	const [canvasWidth, setCanvasWidth] = useState<number>(0);
	const [canvasHeight, setCanvasHeight] = useState<number>(0);
	const [showContent, setShowContent] = useState<boolean>(!previewIcon);
	const [zIndex, setZIndex] = useState<number>(0);

	/**
	 * This effect runs when the component mounts and adds the anchor to the store.
	 * It checks if there is already an anchor with the same id in the store.
	 * If there is, it sets the showContent state to the existing anchor's showContent state
	 * and removes the existing anchor.
	 *
	 * Then it adds the new anchor to the store with the given id and initial properties.
	 */
	useEffect(() => {
		const existingAnchor = anchors[viewportId]?.find(
			(anchor) => anchor.id === id,
		);
		// check if there is already an anchor with the same id
		if (existingAnchor) {
			// set the showContent state to the existing anchor's showContent state
			setShowContent(existingAnchor.showContent);
			// remove the existing anchor
			removeViewportAnchor(viewportId, id);
		}

		addViewportAnchor(viewportId, {
			id,
			distance: 0,
			showContent,
			setShowContent,
			setZIndex,
		});
	}, [viewportId, id]);

	/**
	 * This effect handles the showContent state.
	 * It updates the showContent state in the store whenever it changes.
	 */
	const showContentRef = useRef(showContent);
	useEffect(() => {
		showContentRef.current = showContent;
		// update the anchor's showContent state in the store
		const anchor = anchors[viewportId]?.find((anchor) => anchor.id === id);
		if (anchor) anchor.showContent = showContent;
	}, [showContent]);

	/**
	 * This effect updates the canvas reference when the viewport changes.
	 */
	useEffect(() => {
		if (viewport?.canvas) setCanvas(viewport.canvas);
	}, [viewport]);

	/**
	 * This effect observes the canvas for size changes and updates the canvasWidth and canvasHeight state.
	 * It also sets the initial size of the canvas.
	 */
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
	 * Use effect that listens to the zIndex changes of the anchor.
	 * It updates the zIndex of the portal element
	 * to ensure that the portal is displayed on top of other elements.
	 */
	useEffect(() => {
		if (!portalRef.current) return;
		// Set the zIndex of the portal element
		portalRef.current.style.zIndex = zIndex.toString();
	}, [zIndex]);

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

	/**
	 * The main use effect for the anchor.
	 * It creates a new HTMLElementAnchorCustomData instance
	 * and adds it to the scene tree.
	 */
	useEffect(() => {
		if (!canvas) return;

		const create = () => {
			if (!portalRef.current) return;
			portalRef.current.style.display = "block";
		};

		// the update function that is called on every render call
		// you can do anything here
		const update = (properties: IHTMLElementAnchorUpdateProperties) => {
			if (!portalRef.current) return;
			if (!canvas || !canvas.parentElement) return;

			const offsetWidth = portalRef.current.offsetWidth;
			// we adjust the offsetHeight to ignore the height of the control element group
			// this is necessary to ensure that the portal is positioned correctly
			const offsetHeight =
				portalRef.current.offsetHeight +
				(controlElementGroupRef.current?.offsetHeight || 0);

			// first letter is vertical
			let vertical = !showContentRef.current ? "M" : justification?.[0];
			if (!vertical) {
				// if undefined, we check if the normalized coordinates are above or below the center
				// and then set the vertical position accordingly either to top or bottom
				const canvasHeight = canvas.parentElement.offsetHeight;
				const relativeY =
					(properties.container[1] * (1 / properties.scale[1])) /
					canvasHeight;
				if (relativeY < 0.5) {
					vertical = "B"; // Bottom
				} else {
					vertical = "T"; // Top
				}
			}
			// second letter is horizontal
			let horizontal = !showContentRef.current ? "C" : justification?.[1];
			if (!horizontal) {
				// if undefined, we check if the normalized coordinates are to the left or right of the center
				// and then set the horizontal position accordingly either to right or left
				const canvasWidth = canvas.parentElement.offsetWidth;
				const relativeX =
					(properties.container[0] * (1 / properties.scale[0])) /
					canvasWidth;
				if (relativeX < 0.5) {
					horizontal = "L"; // Left
				} else {
					horizontal = "R"; // Right
				}
			}

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

			// we store the distance in the anchor store
			// this will the update the z-index of the portal
			// to ensure that closer anchors are displayed on top
			updateDistance(viewportId, id, properties.distance);
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
	}, [canvas, location, justification]);

	/**
	 * This function handles the click event on the anchor.
	 * It toggles the showContent state and updates the viewport.
	 * If showContent is true, it hides all other anchors' content.
	 */
	const onAnchorClick = useCallback(() => {
		setShowContent((prev) => {
			if (!prev) {
				anchors[viewportId].forEach((anchor) => {
					if (anchor.id !== id) anchor.setShowContent(false);
				});
				return true;
			} else {
				return false;
			}
		});
		viewport?.render();
	}, [viewportId, id, anchors, viewport]);

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
									showContent === true
										? "none"
										: "auto",
							}}
						>
							{showContent === false ? (
								previewIconElement
							) : (
								<Stack gap={0}>
									{previewIcon && (
										<Group ref={controlElementGroupRef}>
											{closeIconElement}
										</Group>
									)}
									<Group
										style={{
											minWidth:
												"calc(18.75rem * var(--mantine-scale))",
											maxWidth:
												"calc(22.25rem * var(--mantine-scale))",
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
