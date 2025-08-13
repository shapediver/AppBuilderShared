import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewportAnchors} from "@AppBuilderShared/store/useShapeDiverStoreViewportAnchors";
import {AppBuilderContainerNameType} from "@AppBuilderShared/types/shapediver/appbuilder";
import {MantineThemeComponent} from "@mantine/core";
import {
	HTMLElementAnchorCustomData,
	IHTMLElementAnchorUpdateProperties,
	sceneTree,
} from "@shapediver/viewer.session";
import {vec3} from "gl-matrix";
import {useCallback, useEffect, useRef} from "react";
import {
	useAnchorContainer,
	ViewportAnchorProps,
	ViewportAnchorStyleProps,
} from "./shared/AnchorContainer";
import {updatePosition} from "./shared/utils";

export interface ViewportAnchorProps3d extends ViewportAnchorProps {
	/** The 3D location of the anchor in the viewport. */
	location: number[] | vec3;
}

type ViewportAnchorThemePropsType = Partial<ViewportAnchorStyleProps>;

export function ViewportAnchor3dThemeProps(
	props: ViewportAnchorThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function ViewportAnchor3d(
	props: ViewportAnchorProps3d & Partial<ViewportAnchorStyleProps>,
) {
	const {id, justification, location} = props;

	const showContentRef = useRef(false);
	const position = useRef({x: "0px", y: "0px"});

	const {viewportId} = useViewportId();

	const {
		AnchorElement,
		showContent,
		zIndex,
		portalRef,
		portalUpdate,
		controlElementGroupRef,
		controlElementGroupUpdate,
		canvas,
	} = useAnchorContainer({
		type: AppBuilderContainerNameType.Anchor3d,
		properties: props,
	});

	const updateDistance = useShapeDiverStoreViewportAnchors(
		(state) => state.updateDistance,
	);

	/**
	 * This effect updates the showContentRef when the showContent state changes.
	 */
	useEffect(() => {
		showContentRef.current = showContent;
	}, [showContent]);

	/**
	 * Use effect that listens to the zIndex changes of the anchor.
	 * It updates the zIndex of the portal element
	 * to ensure that the portal is displayed on top of other elements.
	 */
	useEffect(() => {
		if (!portalRef.current || zIndex === undefined) return;
		// Set the zIndex of the portal element
		portalRef.current.style.zIndex = zIndex.toString();
	}, [zIndex]);

	/**
	 * Create function for the anchor.
	 *
	 * @returns
	 */
	const create = useCallback(() => {
		if (!portalRef.current) return;
		portalRef.current.style.display = "block";
	}, []);

	/**
	 * The update function that is called on every render call.
	 * It updates the position of the portal element
	 * based on the properties passed to the anchor.
	 *
	 * @param properties - The properties to update.
	 */
	const update = useCallback(
		(properties: IHTMLElementAnchorUpdateProperties) => {
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
				y =
					properties.container[1] * (1 / properties.scale[1]) -
					offsetHeight;
			} else if (vertical === "T") {
				y = properties.container[1] * (1 / properties.scale[1]);
			} else {
				y =
					properties.container[1] * (1 / properties.scale[1]) -
					offsetHeight / 2;
			}

			updatePosition(x + "px", y + "px", portalRef, position);

			// we store the distance in the anchor store
			// this will the update the z-index of the portal
			// to ensure that closer anchors are displayed on top
			updateDistance(viewportId, id, properties.distance);
		},
		[
			portalUpdate,
			controlElementGroupUpdate,
			viewportId,
			id,
			canvas,
			justification,
			updateDistance,
		],
	);

	/**
	 * The main use effect for the anchor.
	 * It creates a new HTMLElementAnchorCustomData instance
	 * and adds it to the scene tree.
	 */
	useEffect(() => {
		if (!canvas) return;

		// check if location is a valid array of three numbers
		if (!Array.isArray(location) || location.length !== 3) return;

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
	}, [canvas, location, create, update]);

	return AnchorElement;
}
