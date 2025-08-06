import {AppBuilderContainerNameType} from "@AppBuilderShared/types/shapediver/appbuilder";
import {MantineThemeComponent} from "@mantine/core";
import React, {useEffect, useRef, useState} from "react";
import {
	useAnchorContainer,
	ViewportAnchorProps,
	ViewportAnchorStyleProps,
} from "./shared/AnchorContainer";
import {cleanUnit, updatePosition} from "./shared/utils";

export interface ViewportAnchorProps2d extends ViewportAnchorProps {
	/** Optional draggable properties */
	draggable?: boolean;
	/** The location of the anchor in the viewport. Can be px (e.g. 100 or "100px"), rem (e.g. 1.5rem), em (e.g. 1.5em), % (e.g. 100%) or calc (e.g. calc(100% - 20px)) */
	location: (string | number)[];
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
	const [initialized, setInitialized] = useState(false);

	const showContentRef = useRef(false);
	const offset = useRef({x: "0px", y: "0px"});
	const position = useRef({x: "0px", y: "0px"});
	const lastComputedPosition = useRef({x: "0px", y: "0px"});

	/**
	 * This function handles the mouse down event on the anchor.
	 * It sets the dragging state to true and stores the offset
	 * to calculate the new position of the anchor.
	 */
	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		setDragging(true);
		offset.current = {
			x: `calc(${e.clientX}px - ${position.current.x})`,
			y: `calc(${e.clientY}px - ${position.current.y})`,
		};
	};

	const {
		AnchorElement,
		showContent,
		portalRef,
		controlElementGroupRef,
		canvas,
		portalUpdate,
		controlElementGroupUpdate,
	} = useAnchorContainer({
		type: AppBuilderContainerNameType.Anchor2d,
		properties: props,
		handleMouseDown,
	});

	/**
	 * This effect updates the showContentRef when the showContent state changes.
	 */
	useEffect(() => {
		showContentRef.current = showContent;
		setInitialized(false);
	}, [showContent]);

	/**
	 * The main use effect for the anchor.
	 * It creates a new HTMLElementAnchorCustomData instance
	 * and adds it to the scene tree.
	 */
	useEffect(() => {
		if (!portalRef.current) return;
		if (!canvas) return;
		if (initialized) return;

		const offsetWidth = portalRef.current.offsetWidth;
		if (!offsetWidth) return;
		// we adjust the offsetHeight to ignore the height of the control element group
		// this is necessary to ensure that the portal is positioned correctly
		const offsetHeight =
			portalRef.current.offsetHeight +
			(controlElementGroupRef.current?.offsetHeight || 0);

		// clean the input location
		const location = inputLocation.map((p, i) => {
			const cleaned = cleanUnit(p);
			// this should never happen, but we handle it gracefully
			if (cleaned == null) {
				console.warn(`Invalid location at index ${i}:`, p);
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

		// evaluate the offset of the current position
		// to the last computed position
		let offsetX = "0px";
		let offsetY = "0px";
		if (lastComputedPosition.current.x && lastComputedPosition.current.y) {
			offsetX = `calc(${position.current.x} - ${lastComputedPosition.current.x})`;
			offsetY = `calc(${position.current.y} - ${lastComputedPosition.current.y})`;
		}

		// we store the last computed position
		// so that we can evaluate the offset
		lastComputedPosition.current = {
			x,
			y,
		};

		// apply the offset to the newly computed position
		x = `calc(${x} + ${offsetX})`;
		y = `calc(${y} + ${offsetY})`;

		updatePosition(x, y, portalRef, position);
		setInitialized(true);
		portalRef.current.style.display = "block";
	}, [
		portalUpdate,
		controlElementGroupUpdate,
		inputLocation,
		justification,
		initialized,
	]);

	/**
	 * This effect handles the mouse move and mouse up events
	 * to update the position of the anchor while dragging.
	 */
	const handleMouseMove = (e: MouseEvent) => {
		if (!dragging) return;
		if (!portalRef.current) return;

		updatePosition(
			`calc(${e.clientX}px - ${offset.current.x})`,
			`calc(${e.clientY}px - ${offset.current.y})`,
			portalRef,
			position,
		);
	};

	/**
	 * This function handles the mouse up event on the anchor.
	 * It sets the dragging state to false.
	 */
	const handleMouseUp = () => {
		setDragging(false);
	};

	/**
	 * This effect adds event listeners for mouse move and mouse up events
	 * to handle dragging of the anchor.
	 */
	useEffect(() => {
		if (!dragging) return;

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
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
