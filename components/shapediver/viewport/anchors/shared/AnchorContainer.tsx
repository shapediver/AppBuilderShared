import Icon from "@AppBuilderShared/components/ui/Icon";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderShared/store/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAnchors} from "@AppBuilderShared/store/useShapeDiverStoreViewportAnchors";
import {AppBuilderContainerNameType} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import {AppBuilderStandardContainerNameType} from "@AppBuilderShared/types/store/shapediverStoreStandardContainers";
import {
	IAnchor2d,
	IAnchor3d,
} from "@AppBuilderShared/types/store/shapediverStoreViewportAnchors";
import {
	ActionIcon,
	ActionIconProps,
	Flex,
	Group,
	GroupProps,
	MantineBreakpoint,
	Portal,
	Stack,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import {useMediaQuery} from "@mantine/hooks";
import {TAG3D_JUSTIFICATION} from "@shapediver/viewer.session";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import classes from "../../ViewportIcons.module.css";
import {ViewportAnchorProps2d} from "../ViewportAnchor2d";
import {ViewportAnchorProps3d} from "../ViewportAnchor3d";
import {useCanvasPortalUtilities} from "./useCanvasPortalUtilities";
import {useCanvasSize} from "./useCanvasSize";
import {cleanUnit} from "./utils";

export interface ViewportAnchorProps {
	/** If the anchor allows pointer events */
	allowPointerEvents?: boolean;
	/** The justification of the anchor in relation to the location */
	justification?: TAG3D_JUSTIFICATION;
	/** The element to be rendered as the anchor */
	element?: JSX.Element;
	/** Optional icon to be displayed as a preview */
	previewIcon?: IconTypeEnum;
	/** Optional width of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) (default: var(--app-shell-navbar-width)) */
	width?: string | number;
	/** Optional height of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) */
	height?: string | number;
	/** The unique identifier for the anchor */
	id: string;
	/** Mobile fallback options */
	mobileFallback?: {
		/** if the anchor should be completely disabled */
		disabled?: boolean;
		/**
		 * either a different or a new preview icon to show
		 * if undefined, the original previewIcon logic will be used
		 */
		previewIcon?: IconTypeEnum;
		/** fallback container to be used ("left", "right", "top", "bottom") */
		container: AppBuilderContainerNameType;
	};
}

export type ViewportAnchorStyleProps = {
	iconProps?: Partial<ActionIconProps>;
	anchorGroupProps?: Partial<GroupProps>;
	/** Breakpoint below which to to switch to the mobile behavior */
	mobileBreakpoint: MantineBreakpoint;
};

export const viewportAnchorDefaultStyleProps: ViewportAnchorStyleProps = {
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
	mobileBreakpoint: "sm",
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
	handleMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
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
		previewIcon: inputPreviewIcon,
		width: inputWidth = "var(--app-shell-navbar-width)",
		height: inputHeight,
		mobileFallback = {
			/**
			 * By default, if we get into the mobile behavior,
			 * we put everything into the right container.
			 *
			 * If a previewIcon was defined, it is being re-used.
			 */
			container: AppBuilderContainerNameType.Right,
			previewIcon: undefined,
		},
		...rest
	} = properties;

	const portalRef = useRef<HTMLDivElement | null>(null);
	const [portalUpdate, setPortalUpdate] = useState(0);
	const controlElementGroupRef = useRef<HTMLDivElement | null>(null);
	const [controlElementGroupUpdate, setControlElementGroupUpdate] =
		useState(0);

	const {addAdditionalContainer, removeAdditionalContainer} =
		useShapeDiverStoreStandardContainers((state) => ({
			addAdditionalContainer: state.addAdditionalContainer,
			removeAdditionalContainer: state.removeAdditionalContainer,
		}));

	/**
	 * Get the styling properties for the anchor container.
	 * This includes the icon properties and the anchor group properties.
	 * It uses the useProps hook to get the properties from the theme.
	 *
	 * Depending on the type of the anchor, it will return different properties.
	 */
	const {iconProps, anchorGroupProps, mobileBreakpoint} = useProps(
		type === AppBuilderContainerNameType.Anchor2d
			? "ViewportAnchor2d"
			: "ViewportAnchor3d",
		viewportAnchorDefaultStyleProps,
		rest,
	);

	/**
	 * Get the theme object from Mantine.
	 * This includes the breakpoints which we can use to determine if we are above the mobile breakpoint.
	 * The mobileBreakpoint can be set by the user in the theme.
	 */
	const theme = useMantineTheme();
	const aboveMobileBreakpoint = useMediaQuery(
		`(min-width: ${theme.breakpoints[mobileBreakpoint]})`,
		// Default to true to prevent layout shift on first render
		true,
	);

	/**
	 * Get the preview icon for the anchor.
	 * This will return the inputPreviewIcon if we are above the mobile breakpoint,
	 * otherwise it will return the mobileFallback.previewIcon or the inputPreviewIcon.
	 */
	const previewIcon = useMemo(() => {
		if (aboveMobileBreakpoint) {
			return inputPreviewIcon;
		}
		return mobileFallback?.previewIcon || inputPreviewIcon;
	}, [aboveMobileBreakpoint, inputPreviewIcon, mobileFallback]);

	const {viewportId} = useViewportId();
	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);
	const {addAnchor, removeAnchor, updateShowContent, showContent, zIndex} =
		useShapeDiverStoreViewportAnchors((state) => ({
			addAnchor: state.addAnchor,
			removeAnchor: state.removeAnchor,
			updateShowContent: state.updateShowContent,
			showContent:
				state.anchors[viewportId]?.find(
					(a) => a.id === id && a.type === type,
				)?.showContent ?? false,
			zIndex: (() => {
				const anchor = state.anchors[viewportId]?.find(
					(a) =>
						a.id === id &&
						a.type === type &&
						a.type === AppBuilderContainerNameType.Anchor3d,
				);
				if (
					anchor &&
					anchor.type === AppBuilderContainerNameType.Anchor3d &&
					"zIndex" in anchor
				) {
					return (anchor as IAnchor3d).zIndex;
				}
				return undefined;
			})(),
		}));
	const {canvas, allowPointerEventsGlobal} = useCanvasPortalUtilities(
		viewportId,
		portalRef,
		portalUpdate,
	);

	/**
	 * Creates the anchor definition for the store.
	 */
	const anchorDefinition: IAnchor2d | IAnchor3d = useMemo(() => {
		return {
			type,
			id,
			showContent: !previewIcon,
			hideable: !!previewIcon,
		};
	}, [type, id, previewIcon]);

	/**
	 * This effect adds the anchor to the store when the component is mounted
	 * and removes it when the component is unmounted.
	 */
	useEffect(() => {
		// Add the anchor to the store
		addAnchor(viewportId, anchorDefinition);

		return () => {
			// Remove the anchor from the store when the component is unmounted
			removeAnchor(viewportId, id);
		};
	}, [viewportId, id, anchorDefinition]);

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
		if (!viewport) return;

		// Update the showContent state for the current anchor
		updateShowContent(viewportId, id, !showContent);
		viewport?.render();
	}, [viewportId, id, showContent, updateShowContent, viewport]);

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
	 * This will be replaced once this task is done:
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
	 * This will be replaced once this task is done:
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

	/**
	 * If the anchor is draggable, we create an ActionIcon element
	 * that will be displayed in the control element group.
	 * It contains the drag icon and handles the mouse down event.
	 * The iconProps are applied to the ActionIcon.
	 *
	 * This will be replaced once this task is done:
	 * https://shapediver.atlassian.net/browse/SS-8888
	 */
	const dragIconElement = (
		<ActionIcon onMouseDown={handleMouseDown} {...iconProps}>
			<Icon
				type={IconTypeEnum.GridDots}
				color={iconProps?.color}
				className={classes.viewportIcon}
			/>
		</ActionIcon>
	);

	/**
	 * The content of the anchor
	 * Here we have a group with the icons and a group with the main element.
	 */
	const inner = (
		<Stack gap={0} key={id}>
			<Group
				ref={updateControlElementGroupRef}
				style={{
					display: "flex",
					justifyContent: "space-between",
					width: "100%",
					pointerEvents: "auto",
				}}
			>
				{aboveMobileBreakpoint && draggable && dragIconElement}
				{/** The Flex element is used to push the close icon to the right. */}
				<Flex />
				{previewIcon && closeIconElement}
			</Group>
			<Group
				{...anchorGroupProps}
				w={aboveMobileBreakpoint ? width : "100%"}
				h={aboveMobileBreakpoint ? height : "100%"}
				style={{
					...anchorGroupProps?.style,
					overflow: "auto",
				}}
			>
				<Stack
					style={{
						width: "100%",
						height: "100%",
					}}
				>
					{element}
				</Stack>
			</Group>
		</Stack>
	);

	/**
	 * The main anchor element.
	 */
	const AnchorElement = canvas && (
		<Portal
			// We only display the portal once the canvas is available
			// the style is changed in the corresponding functions of the ViewportAnchors
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
					{showContent === false
						? previewIconElement
						: aboveMobileBreakpoint && inner}
				</Group>
			</Group>
		</Portal>
	);

	/**
	 * If we are below the mobile breakpoint, we add the element to the container store.
	 */
	useEffect(() => {
		if (aboveMobileBreakpoint || !showContent) return;
		// if this is disabled on mobile, we don't do anything
		if (mobileFallback.disabled) return;

		const token = addAdditionalContainer(
			// we know this is a standard container, as otherwise it wouldn't have passed the zod checks
			mobileFallback.container as AppBuilderStandardContainerNameType,
			inner,
		);

		return () => {
			if (token) removeAdditionalContainer(token);
		};
	}, [aboveMobileBreakpoint, showContent, mobileFallback]);

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
