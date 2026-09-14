import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import {
	AppBuilderContainerNameType,
	AppBuilderToolbarSide,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {MantineThemeComponent} from "@mantine/core";
import React, {useEffect, useRef, useState} from "react";
import {cleanUnit, simplifyCalc, updatePosition} from "../lib/utils";
import {useShapeDiverStoreViewportAnchors} from "../model/useShapeDiverStoreViewportAnchors";
import {useViewportAnchorTriggerRegistry} from "../model/useViewportAnchorTriggerRegistry";
import {
	useAnchorContainer,
	ViewportAnchorProps,
	ViewportAnchorStyleProps,
} from "./AnchorContainer";

export interface ViewportAnchorProps2d extends ViewportAnchorProps {
	/** Optional draggable properties */
	draggable?: boolean;
	/** The location of the anchor in the viewport. Can be px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) */
	location?: (string | number)[];
}

type ViewportAnchorThemePropsType = Partial<ViewportAnchorStyleProps>;

export function ViewportAnchor2dThemeProps(
	props: ViewportAnchorThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ViewportAnchor2d(
	props: ViewportAnchorProps2d & Partial<ViewportAnchorStyleProps>,
) {
	const {location: inputLocation, justification} = props;

	const [dragging, setDragging] = useState(false);
	const [updatePositionCalculation, setUpdatePositionCalculation] =
		useState(0);

	const initializedRef = useRef(false);
	const showContentRef = useRef(false);
	const dragStartPosition = useRef({x: "", y: ""});
	const offset = useRef({x: "0px", y: "0px"});
	const position = useRef({x: "0px", y: "0px"});
	const lastComputedPosition = useRef({x: "", y: ""});

	const {viewportId} = useViewportId();
	const {dragOffset, updateDragOffset} = useShapeDiverStoreViewportAnchors(
		(state) => ({
			dragOffset: state.dragOffsetMap[viewportId]?.[props.id],
			updateDragOffset: state.updateDragOffset,
		}),
	);

	/**
	 * This function handles the mouse down event on the anchor.
	 * It sets the dragging state to true and stores the offset
	 * to calculate the new position of the anchor.
	 */
	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setDragging(true);
		offset.current = {
			x: simplifyCalc(`calc(${e.clientX}px - ${position.current.x})`),
			y: simplifyCalc(`calc(${e.clientY}px - ${position.current.y})`),
		};
		dragStartPosition.current = {
			x: position.current.x,
			y: position.current.y,
		};
	};

	const {
		AnchorElement,
		showContent,
		portalRef,
		controlElementGroupRef,
		canvas,
		canvasWidth,
		canvasHeight,
		portalUpdate,
		controlElementGroupUpdate,
	} = useAnchorContainer({
		type: AppBuilderContainerNameType.Anchor2d,
		properties: props,
		handleMouseDown,
	});

	const triggerElement = useViewportAnchorTriggerRegistry(
		(state) => state.triggers[props.id],
	);

	/**
	 * This effect updates the showContentRef when the showContent state changes.
	 */
	useEffect(() => {
		showContentRef.current = showContent;
		initializedRef.current = false;
		if (!showContent) {
			lastComputedPosition.current = {x: "", y: ""};
			if (!props.previewIcon && portalRef.current) {
				portalRef.current.style.display = "none";
			}
		}
		setUpdatePositionCalculation((prev) => prev + 1);
	}, [showContent, props.previewIcon]);

	/**
	 * This effect resets positioning when the trigger element changes or mounts.
	 */
	useEffect(() => {
		initializedRef.current = false;
		setUpdatePositionCalculation((prev) => prev + 1);
	}, [triggerElement]);

	/**
	 * Track trigger element rect reactively (animations, transitions, toolbar movements) while open.
	 */
	useEffect(() => {
		if (
			!showContent ||
			!triggerElement ||
			(inputLocation && inputLocation.length >= 2)
		) {
			return;
		}

		let animationFrameId: number;
		let lastRect = triggerElement.getBoundingClientRect();

		const checkRect = () => {
			const newRect = triggerElement.getBoundingClientRect();
			if (
				Math.abs(newRect.left - lastRect.left) > 0.5 ||
				Math.abs(newRect.top - lastRect.top) > 0.5 ||
				Math.abs(newRect.width - lastRect.width) > 0.5 ||
				Math.abs(newRect.height - lastRect.height) > 0.5
			) {
				lastRect = newRect;
				initializedRef.current = false;
				setUpdatePositionCalculation((prev) => prev + 1);
			}
			animationFrameId = requestAnimationFrame(checkRect);
		};

		animationFrameId = requestAnimationFrame(checkRect);
		return () => cancelAnimationFrame(animationFrameId);
	}, [showContent, triggerElement, inputLocation]);

	/**
	 * Recalculate position on window resize while open.
	 */
	useEffect(() => {
		if (!showContent) return;
		const handleResize = () => {
			initializedRef.current = false;
			setUpdatePositionCalculation((prev) => prev + 1);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [showContent]);

	/**
	 * This effect resets positioning when the canvas is resized.
	 * This is necessary when width/height are specified as percentages, because
	 * the initial canvas size is 0 and the first positioning run uses an incorrect
	 * offsetWidth. When the canvas reaches its actual size the position must be recalculated.
	 */
	useEffect(() => {
		initializedRef.current = false;
		setUpdatePositionCalculation((prev) => prev + 1);
	}, [canvasWidth, canvasHeight]);

	/**
	 * Recalculate anchor position when portal content size changes
	 * (e.g. stack navigation, parameter-driven widget updates).
	 */
	useEffect(() => {
		const el = portalRef.current;
		if (!el || !showContent) return;

		let lastW = el.offsetWidth;
		let lastH = el.offsetHeight;

		const observer = new ResizeObserver(() => {
			if (
				Math.abs(el.offsetWidth - lastW) > 1 ||
				Math.abs(el.offsetHeight - lastH) > 1
			) {
				lastW = el.offsetWidth;
				lastH = el.offsetHeight;
				initializedRef.current = false;
				setUpdatePositionCalculation((prev) => prev + 1);
			}
		});
		observer.observe(el);

		return () => observer.disconnect();
	}, [showContent, portalUpdate]);

	/**
	 * The main use effect for the anchor.
	 * It creates a new HTMLElementAnchorCustomData instance
	 * and adds it to the scene tree.
	 */
	useEffect(() => {
		if (!portalRef.current) return;
		if (!canvas) return;
		if (initializedRef.current) return;

		if (!showContentRef.current && !props.previewIcon) {
			portalRef.current.style.display = "none";
			return;
		}

		portalRef.current.style.display = "block";

		const offsetWidth = portalRef.current.offsetWidth;
		if (!offsetWidth) return;
		// we adjust the offsetHeight to ignore the height of the control element group
		// this is necessary to ensure that the portal is positioned correctly
		const offsetHeight =
			portalRef.current.offsetHeight +
			(controlElementGroupRef.current?.offsetHeight || 0);

		let x: string;
		let y: string;

		if (inputLocation && inputLocation.length >= 2) {
			// clean the input location
			const location = inputLocation.map((p, i) => {
				const cleaned = cleanUnit(p);
				// this should never happen, but we handle it gracefully
				if (cleaned == null) {
					Logger.warn(`Invalid location at index ${i}:`, p);
					return "0px";
				}
				return cleaned;
			});

			// first letter is vertical
			const vertical = !showContentRef.current
				? "M"
				: justification?.[0] || "M";

			// second letter is horizontal
			const horizontal = !showContentRef.current
				? "C"
				: justification?.[1] || "C";

			if (horizontal === "R") {
				x = `calc(${location[0]} - ${offsetWidth}px)`;
			} else if (horizontal === "L") {
				x = location[0];
			} else {
				x = `calc(${location[0]} - ${offsetWidth / 2}px)`;
			}

			if (vertical === "B") {
				y = `calc(${location[1]} - ${offsetHeight}px)`;
			} else if (vertical === "T") {
				y = location[1];
			} else {
				y = `calc(${location[1]} - ${offsetHeight / 2}px)`;
			}
		} else if (triggerElement && canvas) {
			const canvasRect = canvas.getBoundingClientRect();
			const triggerRect = triggerElement.getBoundingClientRect();
			const toolbarElement = triggerElement.closest("[role='toolbar']");
			const toolbarRect = toolbarElement?.getBoundingClientRect();
			const GAP = 8;

			const buttonCanvasLeft = triggerRect.left - canvasRect.left;
			const buttonCanvasTop = triggerRect.top - canvasRect.top;
			const buttonCanvasRight = buttonCanvasLeft + triggerRect.width;
			const buttonCanvasBottom = buttonCanvasTop + triggerRect.height;
			const buttonCenterX = buttonCanvasLeft + triggerRect.width / 2;
			const buttonCenterY = buttonCanvasTop + triggerRect.height / 2;

			const toolbarSide =
				(triggerElement
					.closest("[data-toolbar-side]")
					?.getAttribute(
						"data-toolbar-side",
					) as AppBuilderToolbarSide | null) || "bottom";

			// For trigger-anchored panels, use the portal's actual rendered height.
			// (controlElementGroupRef is inside portalRef, so adding it double-counts height).
			const panelHeight = portalRef.current.offsetHeight;
			const panelWidth = offsetWidth;

			// Along-axis alignment. Default is center on the trigger (like a
			// popover). Authors can override with justification ("L"/"R"/"C"
			// horizontally, "T"/"B"/"M" vertically). The panel is allowed to
			// extend past the toolbar; only the canvas edge is clamped later.
			const vJust = justification?.[0];
			const hJust = justification?.[1];

			const alignedX = (): number => {
				if (hJust === "L") return buttonCanvasLeft;
				if (hJust === "R") return buttonCanvasRight - panelWidth;
				return buttonCenterX - panelWidth / 2;
			};
			const alignedY = (): number => {
				if (vJust === "T") return buttonCanvasTop;
				if (vJust === "B") return buttonCanvasBottom - panelHeight;
				return buttonCenterY - panelHeight / 2;
			};

			let candidateX: number;
			let candidateY: number;

			if (toolbarSide === "bottom") {
				const refTop = toolbarRect
					? Math.min(
							buttonCanvasTop,
							toolbarRect.top - canvasRect.top,
						)
					: buttonCanvasTop;
				candidateY = refTop - panelHeight - GAP;
				candidateX = alignedX();
			} else if (toolbarSide === "left") {
				const refRight = toolbarRect
					? Math.max(
							buttonCanvasRight,
							toolbarRect.right - canvasRect.left,
						)
					: buttonCanvasRight;
				candidateX = refRight + GAP;
				candidateY = alignedY();
			} else if (toolbarSide === "right") {
				const refLeft = toolbarRect
					? Math.min(
							buttonCanvasLeft,
							toolbarRect.left - canvasRect.left,
						)
					: buttonCanvasLeft;
				candidateX = refLeft - panelWidth - GAP;
				candidateY = alignedY();
			} else if (toolbarSide === "top") {
				const refBottom = toolbarRect
					? Math.max(
							buttonCanvasBottom,
							toolbarRect.bottom - canvasRect.top,
						)
					: buttonCanvasBottom;
				candidateY = refBottom + GAP;
				candidateX = alignedX();
			} else if (buttonCenterY > canvasHeight / 2) {
				candidateY = buttonCanvasTop - panelHeight - GAP;
				candidateX = alignedX();
			} else {
				candidateY = buttonCanvasBottom + GAP;
				candidateX = alignedX();
			}

			// Canvas collision clamping with safety margin:
			const maxX = Math.max(0, canvasWidth - panelWidth - GAP);
			const maxY = Math.max(0, canvasHeight - panelHeight - GAP);
			const clampedX = Math.max(GAP, Math.min(candidateX, maxX));
			const clampedY = Math.max(GAP, Math.min(candidateY, maxY));

			x = `${Math.round(clampedX)}px`;
			y = `${Math.round(clampedY)}px`;
		} else {
			// Fallback: center in canvas
			const centerX = Math.max(0, (canvasWidth - offsetWidth) / 2);
			const centerY = Math.max(0, (canvasHeight - offsetHeight) / 2);
			x = `${Math.round(centerX)}px`;
			y = `${Math.round(centerY)}px`;
		}

		// evaluate the offset of the current position
		// to the last computed position
		let offsetX = "0px";
		let offsetY = "0px";
		if (lastComputedPosition.current.x && lastComputedPosition.current.y) {
			offsetX = `calc(${position.current.x} - ${lastComputedPosition.current.x})`;
			offsetY = `calc(${position.current.y} - ${lastComputedPosition.current.y})`;
		} else if (dragOffset) {
			// if there is no last computed position, we use the drag offset
			offsetX = `calc(${offsetX} + ${dragOffset.x})`;
			offsetY = `calc(${offsetY} + ${dragOffset.y})`;
		}

		// we store the last computed position
		// so that we can evaluate the offset
		lastComputedPosition.current = {
			x: simplifyCalc(x),
			y: simplifyCalc(y),
		};

		// apply the offset to the newly computed position
		x = simplifyCalc(`calc(${x} + ${offsetX})`);
		y = simplifyCalc(`calc(${y} + ${offsetY})`);

		updatePosition(x, y, portalRef, position);
		initializedRef.current = true;
		portalRef.current.style.display = "block";
	}, [
		updatePositionCalculation,
		portalUpdate,
		controlElementGroupUpdate,
		inputLocation,
		justification,
		dragOffset,
		showContent,
		triggerElement,
		canvas,
		canvasWidth,
		canvasHeight,
	]);

	/**
	 * This effect handles the mouse move and mouse up events
	 * to update the position of the anchor while dragging.
	 */
	const handleMouseMove = (e: MouseEvent) => {
		if (!dragging) return;
		if (!portalRef.current) return;

		updatePosition(
			simplifyCalc(`calc(${e.clientX}px - ${offset.current.x})`),
			simplifyCalc(`calc(${e.clientY}px - ${offset.current.y})`),
			portalRef,
			position,
		);
	};

	/**
	 * This effect adds event listeners for mouse move and mouse up events
	 * to handle dragging of the anchor.
	 */
	useEffect(() => {
		if (!dragging) return;
		// Disable the dragging state when the mouse is released
		const pointerEndEvent = () => {
			setDragging(false);

			// calculate the difference between dragStartPosition and the current position
			const deltaX = simplifyCalc(
				`calc(${position.current.x} - ${dragStartPosition.current.x})`,
			);
			const deltaY = simplifyCalc(
				`calc(${position.current.y} - ${dragStartPosition.current.y})`,
			);
			// add this difference to the dragOffset in the store
			updateDragOffset(viewportId, props.id, {
				x: deltaX,
				y: deltaY,
			});
		};

		window.addEventListener("pointermove", handleMouseMove);
		window.addEventListener("pointerup", pointerEndEvent);
		window.addEventListener("pointercancel", pointerEndEvent);

		return () => {
			window.removeEventListener("pointermove", handleMouseMove);
			window.removeEventListener("pointerup", pointerEndEvent);
			window.removeEventListener("pointercancel", pointerEndEvent);
		};
	}, [dragging]);

	/**
	 * This effect cleans up the dragging state when the component unmounts.
	 * It ensures that the dragging state is reset to false
	 * to avoid any lingering effects after the component is removed.
	 */
	useEffect(() => {
		return () => {
			setDragging(false);
		};
	}, []);

	return AnchorElement;
}
