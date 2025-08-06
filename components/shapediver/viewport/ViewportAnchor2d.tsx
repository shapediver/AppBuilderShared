import Icon from "@AppBuilderShared/components/ui/Icon";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAnchors2d} from "@AppBuilderShared/store/useShapeDiverStoreViewportAnchors2d";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	ActionIcon,
	ActionIconProps,
	Group,
	GroupProps,
	MantineThemeComponent,
	Portal,
	Stack,
	useProps,
} from "@mantine/core";
import {
	addListener,
	EventResponseMapping,
	EVENTTYPE_CAMERA,
	IEvent,
	removeListener,
	TAG3D_JUSTIFICATION,
} from "@shapediver/viewer.session";
import React, {
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import classes from "./ViewportIcons.module.css";

interface Props {
	allowPointerEvents?: boolean;
	location: (string | number)[];
	justification?: TAG3D_JUSTIFICATION;
	element?: JSX.Element | ReactNode;
	previewIcon?: IconTypeEnum;
	draggable?: boolean;
	/** Optional width of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), or % (e.g. 100%) */
	width?: string | number;
	/** Optional height of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), or % (e.g. 100%) */
	height?: string | number;
	id: string;
}

type StyleProps = {
	iconProps?: Partial<ActionIconProps>;
	anchorGroupProps?: Partial<GroupProps>;
};

const defaultStyleProps: Partial<StyleProps> = {
	iconProps: {
		size: "md",
		variant: "subtle",
		color: "white",
		style: {
			mixBlendMode: "difference",
			filter: "contrast(0.5)",
		},
	},
	anchorGroupProps: {
		style: {
			backgroundColor: "var(--mantine-color-body)",
			borderRadius: "var(--mantine-radius-md)",
		},
	},
};

type ViewportAnchorThemePropsType = Partial<StyleProps>;

export function ViewportAnchorThemeProps(
	props: ViewportAnchorThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ViewportAnchor2d(props: Props & Partial<StyleProps>) {
	const {
		allowPointerEvents,
		location: inputLocation,
		justification,
		element,
		previewIcon,
		draggable = true,
		width: inputWidth = "var(--app-shell-navbar-width)",
		height: inputHeight,
		id,
		...rest
	} = props;

	const {location, width, height} = useMemo(() => {
		return {
			location: inputLocation.map((p) => {
				if (typeof p === "number") return `${p}px`;
				return p;
			}),
			width:
				typeof inputWidth === "number" ? `${inputWidth}px` : inputWidth,
			height:
				typeof inputHeight === "number"
					? `${inputHeight}px`
					: inputHeight,
		};
	}, [inputLocation, inputWidth, inputHeight]);

	const {viewportId} = useViewportId();

	const {iconProps, anchorGroupProps} = useProps(
		"ViewportAnchor2d",
		defaultStyleProps,
		rest,
	);

	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);

	const {anchors, addViewportAnchor, removeViewportAnchor} =
		useShapeDiverStoreViewportAnchors2d((state) => ({
			anchors: state.anchors,
			addViewportAnchor: state.addAnchor,
			removeViewportAnchor: state.removeAnchor,
		}));

	const [allowPointerEventsGlobal, setAllowPointerEventsGlobal] =
		useState<boolean>(true);
	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
	const [canvasWidth, setCanvasWidth] = useState<number>(0);
	const [canvasHeight, setCanvasHeight] = useState<number>(0);
	const [showContent, setShowContent] = useState<boolean>(!previewIcon);
	const [zIndex, setZIndex] = useState<number>(0);
	const [dragging, setDragging] = useState(false);
	const offset = useRef({x: "0px", y: "0px"});
	const position = useRef({x: "0px", y: "0px"});
	const [initialized, setInitialized] = useState(false);

	const updatePosition = (x: string, y: string) => {
		if (!portalRef.current) return;
		position.current.x = x;
		position.current.y = y;
		portalRef.current.style.left = x;
		portalRef.current.style.top = y;
	};

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
	 * It also adds event listeners for camera start and end events
	 * to manage the allowPointerEventsGlobal state.
	 */
	useEffect(() => {
		if (viewport?.canvas) setCanvas(viewport.canvas);

		const tokenStart = addListener(
			EVENTTYPE_CAMERA.CAMERA_START,
			(e: IEvent) => {
				const cameraEvent =
					e as EventResponseMapping[EVENTTYPE_CAMERA.CAMERA_START];
				if (cameraEvent.viewportId !== viewport.id) return;
				setAllowPointerEventsGlobal(false);
			},
		);

		const tokenEnd = addListener(
			EVENTTYPE_CAMERA.CAMERA_END,
			(e: IEvent) => {
				const cameraEvent =
					e as EventResponseMapping[EVENTTYPE_CAMERA.CAMERA_END];
				if (cameraEvent.viewportId !== viewport.id) return;
				setAllowPointerEventsGlobal(true);
			},
		);

		return () => {
			removeListener(tokenStart);
			removeListener(tokenEnd);
		};
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
		if (!portalRef.current) return;
		if (initialized) return;

		const offsetWidth = portalRef.current.offsetWidth;
		// we adjust the offsetHeight to ignore the height of the control element group
		// this is necessary to ensure that the portal is positioned correctly
		const offsetHeight =
			portalRef.current.offsetHeight +
			(controlElementGroupRef.current?.offsetHeight || 0);

		// first letter is vertical
		const vertical = !showContentRef.current
			? "M"
			: justification?.[0] || "M";

		// second letter is horizontal
		const horizontal = !showContentRef.current
			? "C"
			: justification?.[1] || "C";

		let x, y;
		if (horizontal === "R") {
			x = `calc(${location[0]} - ${offsetWidth}px)`;
		} else if (horizontal === "L") {
			x = location[0];
		} else {
			x = `calc(${location[0]} - ${offsetWidth / 2}px)`;
		}

		if (vertical === "B") {
			y = location[1];
		} else if (vertical === "T") {
			y = `calc(${location[1]} - ${offsetHeight}px)`;
		} else {
			y = `calc(${location[1]} - ${offsetHeight / 2}px)`;
		}

		updatePosition(x, y);
		setInitialized(true);
		portalRef.current.style.display = "flex";
	}, [canvasWidth, canvasHeight, location, justification]);

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

	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setDragging(true);
		offset.current = {
			x: `calc(${e.clientX}px - ${position.current.x})`,
			y: `calc(${e.clientY}px - ${position.current.y})`,
		};
	};

	const handleMouseMove = (e: MouseEvent) => {
		if (!dragging) return;
		if (!portalRef.current) return;

		updatePosition(
			`calc(${e.clientX}px - ${offset.current.x})`,
			`calc(${e.clientY}px - ${offset.current.y})`,
		);
	};

	const handleMouseUp = () => {
		setDragging(false);
	};

	useEffect(() => {
		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [dragging]);

	const previewIconElement = (
		<ActionIcon onClick={onAnchorClick} {...iconProps}>
			<Icon
				type={previewIcon!}
				color={iconProps?.color}
				className={classes.viewportIcon}
			/>
		</ActionIcon>
	);

	const closeIconElement = (
		<ActionIcon onClick={onAnchorClick} {...iconProps}>
			<Icon
				type={IconTypeEnum.X}
				color={iconProps?.color}
				className={classes.viewportIcon}
			/>
		</ActionIcon>
	);

	return (
		canvas && (
			<Portal
				style={{display: "none"}}
				target={canvas.parentElement || undefined}
			>
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
							top: position.current.y,
							left: position.current.x,
						}}
					>
						<Group
							color="inherit"
							style={{
								pointerEvents:
									allowPointerEventsGlobal === false ||
									(allowPointerEvents === false &&
										showContent === true)
										? "none"
										: "auto",
							}}
						>
							{showContent === false ? (
								previewIconElement
							) : (
								<Stack
									gap={0}
									onMouseDown={
										draggable ? handleMouseDown : undefined
									}
								>
									<Group
										ref={controlElementGroupRef}
										style={{
											display: "flex",
											justifyContent: "flex-end",
											width: "100%",
											pointerEvents: "auto",
										}}
									>
										{previewIcon && closeIconElement}
									</Group>
									<Group
										{...anchorGroupProps}
										w={width}
										h={height}
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
