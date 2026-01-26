import {Icon, IconType} from "@AppBuilderLib/shared/ui/Icon";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import shellClasses from "@AppBuilderShared/pages/templates/AppBuilderAppShellTemplatePage.module.css";
import {useShapeDiverStoreStandardContainers} from "@AppBuilderShared/store/useShapeDiverStoreStandardContainers";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAnchors} from "@AppBuilderShared/store/useShapeDiverStoreViewportAnchors";
import {AppBuilderContainerNameType} from "@AppBuilderShared/types/shapediver/appbuilder";
import {ViewportIconsOptionalProps} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {AppBuilderStandardContainerNameType} from "@AppBuilderShared/types/store/shapediverStoreStandardContainers";
import {
	IAnchor2d,
	IAnchor3d,
} from "@AppBuilderShared/types/store/shapediverStoreViewportAnchors";
import {
	ActionIcon,
	Box,
	Flex,
	Group,
	MantineBreakpoint,
	Paper,
	PaperProps,
	Portal,
	ScrollArea,
	Stack,
	StackProps,
	useMantineTheme,
	useProps,
} from "@mantine/core";
import {useMediaQuery} from "@mantine/hooks";
import {
	ISelectionParameterProps,
	TAG3D_JUSTIFICATION,
} from "@shapediver/viewer.session";
import {
	default as React,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import ViewportIconButton, {
	defaultStyleProps as ViewportIconButtonDefaultStyleProps,
	ViewportIconButtonProps,
} from "../../buttons/ViewportIconButton";
import {defaultStyleProps as ViewportIconsDefaultStyleProps} from "../../ViewportIcons";
import classes from "../../ViewportIcons.module.css";
import {ViewportAnchorProps2d} from "../ViewportAnchor2d";
import {ViewportAnchorProps3d} from "../ViewportAnchor3d";
import {useAnchorSelection} from "./useAnchorSelection";
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
	previewIcon?: IconType;
	/** Optional width of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) (default: var(--app-shell-navbar-width)) */
	width?: string | number;
	/** Optional height of the element. Can be either in px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) */
	height?: string | number;
	/** The unique identifier for the anchor */
	id: string;
	/** Option to use Paper component (default: true) */
	useContainer?: boolean;
	/** Closing strategy if the anchor can be closed.  */
	closingStrategy?: "button" | "emptyClick";
	/** Mobile fallback options */
	mobileFallback?: {
		/** if the anchor should be completely disabled */
		disabled?: boolean;
		/**
		 * either a different or a new preview icon to show
		 * if undefined, the original previewIcon logic will be used
		 */
		previewIcon?: IconType;
		/** fallback container to be used ("left", "right", "top", "bottom") */
		container?: AppBuilderContainerNameType;
	};
	/** Optional selection options. These options replace the behavior of the previewIcon and show the corresponding Anchor when the selection is active. (default: undefined) */
	selectionProperties?: Omit<
		ISelectionParameterProps,
		"minimumSelection" | "maximumSelection" | "deselectOnEmpty" | "prompt"
	>;
}

export type ViewportAnchorStyleProps = {
	anchorPaperProps?: Partial<PaperProps>;
	anchorStackProps?: Partial<StackProps>;
	previewIconProps?: {
		paperStyleProps?: ViewportIconsOptionalProps["style"];
		paperProps?: ViewportIconsOptionalProps["paperProps"];
		iconProps?: ViewportIconButtonProps["iconProps"];
		actionIconProps?: ViewportIconButtonProps["actionIconProps"];
	};
	/** Breakpoint below which to to switch to the mobile behavior */
	mobileBreakpoint: MantineBreakpoint;
};

export const viewportAnchorDefaultStyleProps: ViewportAnchorStyleProps = {
	anchorPaperProps: {
		style: {
			...ViewportIconsDefaultStyleProps.style,
		},
		pt: 0,
		shadow: "md",
	},
	anchorStackProps: {
		style: {
			// the only other styling I added is the border radius
			// as otherwise this looks really bad
			borderRadius: "var(--mantine-radius-md)",
		},
	},
	mobileBreakpoint: "sm",
	previewIconProps: {
		paperStyleProps: ViewportIconsDefaultStyleProps.style,
		paperProps: ViewportIconsDefaultStyleProps.paperProps,
		iconProps: ViewportIconButtonDefaultStyleProps.iconProps,
		actionIconProps: ViewportIconButtonDefaultStyleProps.actionIconProps,
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
		mobileFallback: inputMobileFallback,
		useContainer = true,
		closingStrategy,
		selectionProperties,
		...rest
	} = properties;

	const portalRef = useRef<HTMLDivElement | null>(null);
	const [portalUpdate, setPortalUpdate] = useState(0);
	const controlElementGroupRef = useRef<HTMLDivElement | null>(null);
	const [controlElementGroupUpdate, setControlElementGroupUpdate] =
		useState(0);

	const {addAdditionalContainerContent, removeAdditionalContainerContent} =
		useShapeDiverStoreStandardContainers((state) => ({
			addAdditionalContainerContent: state.addAdditionalContainerContent,
			removeAdditionalContainerContent:
				state.removeAdditionalContainerContent,
		}));

	/**
	 * Get the styling properties for the anchor container.
	 * This includes the icon properties and the anchor group properties.
	 * It uses the useProps hook to get the properties from the theme.
	 *
	 * Depending on the type of the anchor, it will return different properties.
	 */
	const {
		anchorPaperProps,
		anchorStackProps,
		previewIconProps,
		mobileBreakpoint,
	} = useProps(
		type === AppBuilderContainerNameType.Anchor2d
			? "ViewportAnchor2d"
			: "ViewportAnchor3d",
		viewportAnchorDefaultStyleProps,
		rest,
	);

	// Extract the draggable property if it exists
	const draggable =
		"draggable" in properties ? (properties.draggable ?? false) : false;

	// Extract the useCloseButton property if it exists
	const useCloseButton =
		"useCloseButton" in properties
			? (properties.useCloseButton ?? false)
			: false;

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

	const {mobileDisabled, mobilePreviewIcon, mobileContainer} = useMemo(() => {
		return {
			mobileDisabled: inputMobileFallback?.disabled,
			mobilePreviewIcon: inputMobileFallback?.previewIcon,
			mobileContainer:
				inputMobileFallback?.container ||
				AppBuilderContainerNameType.Right,
		};
	}, [inputMobileFallback]);

	/**
	 * Get the preview icon for the anchor.
	 * This will return the inputPreviewIcon if we are above the mobile breakpoint,
	 * otherwise it will return the mobileFallback.previewIcon or the inputPreviewIcon.
	 */
	const previewIcon = useMemo(() => {
		if (aboveMobileBreakpoint) {
			return inputPreviewIcon;
		}
		return mobilePreviewIcon || inputPreviewIcon;
	}, [aboveMobileBreakpoint, inputPreviewIcon, mobilePreviewIcon]);

	const canBeHidden = useMemo(() => {
		return !!previewIcon || !!selectionProperties;
	}, [previewIcon, selectionProperties]);

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
			showContent: !canBeHidden,
			hideable: canBeHidden,
		};
	}, [type, id, canBeHidden]);

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

	useEffect(() => {
		if (!canvas) return;
		// don't do this if we use selection properties
		if (selectionProperties) return;

		if (canBeHidden && closingStrategy === "emptyClick" && showContent) {
			const handleClickOutside = (event: MouseEvent) => {
				// only move forward if the left mouse button was clicked
				if (event.button === 0) {
					updateShowContent(viewportId, id, false);
					canvas.removeEventListener(
						"pointerdown",
						handleClickOutside,
					);
				}
			};

			canvas.addEventListener("pointerdown", handleClickOutside);
			return () => {
				canvas.removeEventListener("pointerdown", handleClickOutside);
			};
		}
	}, [
		selectionProperties,
		canvas,
		canBeHidden,
		closingStrategy,
		showContent,
		viewportId,
		id,
		updateShowContent,
		viewport,
	]);

	// use the selection hook to manage the selection state
	// and open the anchor when an object is selected
	useAnchorSelection(
		selectionProperties,
		viewportId,
		showContent,
		aboveMobileBreakpoint,
		id,
		updateShowContent,
	);

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
	 */
	const previewIconElement = previewIcon ? (
		<Paper
			style={{...previewIconProps?.paperStyleProps}}
			{...previewIconProps?.paperProps}
		>
			<ViewportIconButton
				actionIconProps={{
					...previewIconProps?.actionIconProps,
				}}
				iconProps={{
					...previewIconProps?.iconProps,
				}}
				label=""
				iconType={previewIcon! as string}
				onMouseDown={toggleContent}
			/>
		</Paper>
	) : undefined;

	/**
	 * If the previewIcon is provided, we create an ActionIcon element
	 * that will be displayed when the anchor content is shown.
	 * It contains the close icon and toggles the content visibility
	 * when clicked. The iconProps are applied to the ActionIcon.
	 */
	const closeIconElement = (
		<ViewportIconButton
			styles={{
				root: {
					backgroundColor:
						"var(--ai-bg, var(--mantine-primary-color-filled))",
				},
			}}
			label=""
			iconType={"tabler:x"}
			onMouseDown={toggleContent}
		/>
	);

	const marginOffset = "calc(-0.2rem * var(--mantine-scale))";
	/**
	 * If the anchor is draggable, we create an ActionIcon element
	 * that will be displayed in the control element group.
	 * It contains the drag icon and handles the mouse down event.
	 * The iconProps are applied to the ActionIcon.
	 */
	const dragIconElement = (
		<ActionIcon
			onMouseDown={handleMouseDown}
			className={classes.ViewportIcon}
			w={"4.5rem"} // icon size is 1.5rem, so we multiply by 3
			variant="subtle"
			styles={{
				root: {
					backgroundColor:
						"var(--ai-bg, var(--mantine-primary-color-filled))",
				},
			}}
		>
			<Icon
				iconType={"tabler:grip-horizontal"}
				color={"var(--mantine-color-default-color)"}
			/>
			<Icon
				iconType={"tabler:grip-horizontal"}
				color={"var(--mantine-color-default-color)"}
				// offset so that the icons appear as a single icon
				style={{marginLeft: marginOffset, marginRight: marginOffset}}
			/>
			<Icon
				iconType={"tabler:grip-horizontal"}
				color={"var(--mantine-color-default-color)"}
			/>
		</ActionIcon>
	);

	const hasDragIcon = useMemo(
		() => aboveMobileBreakpoint && draggable,
		[aboveMobileBreakpoint, draggable],
	);
	const hasCloseIcon = useMemo(
		() => canBeHidden && (closingStrategy === "button" || useCloseButton),
		[canBeHidden, closingStrategy, useCloseButton],
	);

	/**
	 * The content of the anchor
	 * Here we have a group with the icons and a group with the main element.
	 */
	const inner = (
		<Stack gap={0} key={id} {...anchorStackProps}>
			<Flex
				ref={updateControlElementGroupRef}
				align="center"
				style={{
					width: "100%",
					pointerEvents: "auto",
				}}
			>
				<Box style={{flex: 1}} />
				<Group ta="center">{hasDragIcon && dragIconElement}</Group>
				<Group
					style={{
						flex: 1,
						display: "flex",
						justifyContent: "flex-end",
					}}
				>
					{hasCloseIcon && closeIconElement}
				</Group>
			</Flex>
			<Group
				w={aboveMobileBreakpoint ? width : "100%"}
				h={aboveMobileBreakpoint ? height : "100%"}
				style={{
					overflow: "auto",
				}}
			>
				<ScrollArea
					h={"100%"}
					w={"100%"}
					className={shellClasses.addShellWidgetsContainer}
					type="auto"
				>
					{element}
				</ScrollArea>
			</Group>
		</Stack>
	);

	/**
	 * The inner container that wraps the content of the anchor.
	 * If useContainer is true, we wrap the content in a Paper component
	 * with the provided anchorPaperProps. If not, we just return the inner content.
	 * If we are below the mobile breakpoint, we return null as the content
	 * will be rendered in the standard container.
	 */
	const innerContainer = useMemo(() => {
		if (aboveMobileBreakpoint) {
			if (useContainer) {
				return (
					<Paper
						{...anchorPaperProps}
						pt={hasCloseIcon || hasDragIcon ? 0 : undefined}
					>
						{inner}
					</Paper>
				);
			} else {
				return inner;
			}
		}
		return null;
	}, [
		aboveMobileBreakpoint,
		anchorPaperProps,
		hasCloseIcon,
		hasDragIcon,
		inner,
		useContainer,
	]);

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
						display: "none",
					}}
				>
					{showContent === false
						? previewIconElement
						: innerContainer}
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
		if (mobileDisabled) return;

		const token = addAdditionalContainerContent(
			// we know this is a standard container, as otherwise it wouldn't have passed the zod checks
			mobileContainer as AppBuilderStandardContainerNameType,
			inner,
		);

		return () => {
			if (token) removeAdditionalContainerContent(token);
		};
	}, [
		aboveMobileBreakpoint,
		showContent,
		mobileContainer,
		mobileDisabled,
		inner.key,
	]);

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
