import Icon from "@AppBuilderShared/components/ui/Icon";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAnchors} from "@AppBuilderShared/store/useShapeDiverStoreViewportAnchors";
import {AppBuilderContainerNameType} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {
	IAnchor2d,
	IAnchor3d,
} from "@AppBuilderShared/types/store/shapediverStoreViewportAnchors";
import {
	ActionIcon,
	ActionIconProps,
	Group,
	GroupProps,
	Portal,
	Stack,
	useProps,
} from "@mantine/core";
import {TAG3D_JUSTIFICATION} from "@shapediver/viewer.session";
import React, {ReactNode, useCallback, useMemo, useRef, useState} from "react";
import classes from "../../ViewportIcons.module.css";
import {ViewportAnchorProps2d} from "../ViewportAnchor2d";
import {ViewportAnchorProps3d} from "../ViewportAnchor3d";
import {useCanvasSize} from "./useCanvasSize";
import {useRegisterAnchor} from "./useRegisterAnchor";
import {useViewportCanvasPortal} from "./useViewportUtilities";
import {cleanUnit} from "./utils";

export interface ViewportAnchorProps {
	/** If the anchor allows pointer events */
	allowPointerEvents?: boolean;
	/** The justification of the anchor in relation to the location */
	justification?: TAG3D_JUSTIFICATION;
	/** The element to be rendered as the anchor */
	element?: JSX.Element | ReactNode;
	/** Optional icon to be displayed as a preview */
	previewIcon?: IconTypeEnum;
	/** Optional width of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) */
	width?: string | number;
	/** Optional height of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) */
	height?: string | number;
	/** The unique identifier for the anchor */
	id: string;
}

export type ViewportAnchorStyleProps = {
	iconProps?: Partial<ActionIconProps>;
	anchorGroupProps?: Partial<GroupProps>;
};

export const viewportAnchorDefaultStyleProps: Partial<ViewportAnchorStyleProps> =
	{
		// These icon properties will be replace once this task is done:
		// https://shapediver.atlassian.net/browse/SS-8888
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
				// this background color is the same as used in all other containers
				backgroundColor: "var(--mantine-color-body)",
				// the only other styling I added is the border radius
				// as otherwise this looks really bad
				borderRadius: "var(--mantine-radius-md)",
			},
		},
	};

interface AnchorContainerProps {
	/** The type of the component, used for styling */
	type:
		| AppBuilderContainerNameType.Anchor2d
		| AppBuilderContainerNameType.Anchor3d;
	/** The properties of the anchor including the styling properties */
	properties: (ViewportAnchorProps2d | ViewportAnchorProps3d) &
		Partial<ViewportAnchorStyleProps>;
	/** Optional mouse down handler for the anchor, this is only needed for draggable anchors */
	handleMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * This hook is used to manage the anchor container.
 * As both, the 2D and 3D anchors share a major part of the logic,
 * this hook is used to encapsulate the logic and avoid code duplication.
 *
 * It returns the AnchorElement and various properties related to the anchor,
 * such as showContent, zIndex, portalRef, controlElementGroupRef, canvas, etc.
 *
 * @param param0 The properties of the anchor container including the type, properties, position and optional mouse down handler.
 * @returns
 */
export function useAnchorContainer({
	type,
	properties,
	handleMouseDown,
}: AnchorContainerProps) {
	const {
		allowPointerEvents,
		element,
		id,
		previewIcon,
		width: inputWidth = "var(--app-shell-navbar-width)",
		height: inputHeight,
		...rest
	} = properties;

	const [showContent, setShowContent] = useState<boolean>(!previewIcon);
	const [zIndex, setZIndex] = useState<number>(0);

	const portalRef = useRef<HTMLDivElement | null>(null);
	const [portalUpdate, setPortalUpdate] = useState(0);
	const controlElementGroupRef = useRef<HTMLDivElement | null>(null);
	const [controlElementGroupUpdate, setControlElementGroupUpdate] =
		useState(0);

	/**
	 * Get the styling properties for the anchor container.
	 * This includes the icon properties and the anchor group properties.
	 * It uses the useProps hook to get the properties from the theme.
	 *
	 * Depending on the type of the anchor, it will return different properties.
	 */
	const {iconProps, anchorGroupProps} = useProps(
		type === AppBuilderContainerNameType.Anchor2d
			? "ViewportAnchor2d"
			: "ViewportAnchor3d",
		viewportAnchorDefaultStyleProps,
		rest,
	);

	const {viewportId} = useViewportId();
	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);
	const {anchors} = useShapeDiverStoreViewportAnchors((state) => ({
		anchors: state.anchors,
	}));
	const {canvas, allowPointerEventsGlobal} = useViewportCanvasPortal(
		viewportId,
		portalRef,
	);

	/**
	 * Creates the anchor definition for the store.
	 * In case of type "3d", it includes the setZIndex function
	 * to update the z-index of the anchor.
	 */
	const anchorDefinition: IAnchor2d | IAnchor3d = useMemo(() => {
		if (type === AppBuilderContainerNameType.Anchor3d) {
			return {
				type,
				id,
				showContent,
				setShowContent: setShowContent,
				setZIndex: setZIndex,
			} as IAnchor3d;
		} else {
			return {
				type,
				id,
				showContent,
				setShowContent,
			};
		}
	}, [type, id, showContent]);

	// Register the anchor in the store
	useRegisterAnchor(viewportId, anchorDefinition);

	// Extract the draggable property if it exists
	const draggable =
		"draggable" in properties ? (properties.draggable ?? false) : false;

	// Calculate the width and height based on the input values
	const {width, height} = useMemo(() => {
		return {
			width: cleanUnit(inputWidth),
			height: cleanUnit(inputHeight),
		};
	}, [inputWidth, inputHeight]);

	// Get the canvas size
	const {width: canvasWidth, height: canvasHeight} = useCanvasSize(canvas);

	// Determine the pointer events style based on the global state and anchor properties
	const pointerEvents = useMemo(() => {
		return allowPointerEventsGlobal === false ||
			(allowPointerEvents === false && showContent === true)
			? "none"
			: "auto";
	}, [allowPointerEventsGlobal, allowPointerEvents, showContent]);

	/**
	 * This function handles the click event on the anchor.
	 * It toggles the showContent state and updates the viewport.
	 * If showContent is true, it hides all other anchors' content.
	 */
	const toggleContent = useCallback(() => {
		setShowContent((prev) => {
			if (!prev) {
				anchors[viewportId].forEach((anchor) => {
					if (anchor.id !== id && anchor.type === type)
						anchor.setShowContent(false);
				});
				return true;
			} else {
				return false;
			}
		});
		viewport?.render();
	}, [viewport, type]);

	/**
	 * This effect updates the portal reference when the viewport changes.
	 * It also updates the portal update state to be able to trigger a useEffect.
	 */
	const updatePortalRef = useCallback((ref: HTMLDivElement | null) => {
		portalRef.current = ref;
		setPortalUpdate((prev) => prev + 1);
	}, []);

	/**
	 * This effect updates the control element group reference when the viewport changes.
	 * It also updates the control element group update state to be able to trigger a useEffect.
	 */
	const updateControlElementGroupRef = useCallback(
		(ref: HTMLDivElement | null) => {
			controlElementGroupRef.current = ref;
			setControlElementGroupUpdate((prev) => prev + 1);
		},
		[],
	);

	/**
	 * If a preview icon is provided, we create an ActionIcon element
	 * that will be displayed when the anchor content is not shown.
	 *
	 * It contains the icon and toggles the content visibility
	 * when clicked. The iconProps are applied to the ActionIcon.
	 *
	 * This will be replace once this task is done:
	 * https://shapediver.atlassian.net/browse/SS-8888
	 */
	const previewIconElement = (
		<ActionIcon onClick={toggleContent} {...iconProps}>
			<Icon
				type={previewIcon!}
				color={iconProps?.color}
				className={classes.viewportIcon}
			/>
		</ActionIcon>
	);

	/**
	 * If the previewIcon is provided, we create an ActionIcon element
	 * that will be displayed when the anchor content is shown.
	 * It contains the close icon and toggles the content visibility
	 * when clicked. The iconProps are applied to the ActionIcon.
	 *
	 * This will be replace once this task is done:
	 * https://shapediver.atlassian.net/browse/SS-8888
	 */
	const closeIconElement = (
		<ActionIcon onClick={toggleContent} {...iconProps}>
			<Icon
				type={IconTypeEnum.X}
				color={iconProps?.color}
				className={classes.viewportIcon}
			/>
		</ActionIcon>
	);

	const AnchorElement = canvas && (
		<Portal
			// We only display the portal if the canvas is available
			style={{display: "none"}}
			target={canvas.parentElement || undefined}
		>
			<Group
				// Necessary styling to ensure the portal is positioned correctly
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
					ref={updatePortalRef}
					// Main portal element
					style={{
						position: "absolute",
						pointerEvents: pointerEvents,
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
								ref={updateControlElementGroupRef}
								style={{
									display: "flex",
									justifyContent: "flex-end",
									width: "100%",
									pointerEvents: "auto",
								}}
							>
								{previewIcon && closeIconElement}
							</Group>
							<Group {...anchorGroupProps} w={width} h={height}>
								<Stack style={{width: "100%"}}>{element}</Stack>
							</Group>
						</Stack>
					)}
				</Group>
			</Group>
		</Portal>
	);

	return {
		AnchorElement,
		showContent,
		zIndex,
		canvas,
		portalRef,
		portalUpdate,
		controlElementGroupRef,
		controlElementGroupUpdate,
	};
}
