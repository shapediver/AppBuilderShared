import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {Group, Portal} from "@mantine/core";
import {
	HTMLElementAnchorCustomData,
	HTMLElementAnchorData,
	sceneTree,
	TAG3D_JUSTIFICATION,
} from "@shapediver/viewer.session";
import {vec2, vec3} from "gl-matrix";
import React, {ReactNode, useEffect, useState} from "react";

interface Props {
	allowPointerEvents?: boolean;
	location: number[];
	justification?: TAG3D_JUSTIFICATION;

	element?: JSX.Element | ReactNode;
}

export default function ViewportAnchor(props: Props) {
	const {allowPointerEvents, justification, location, element} = props;

	const {viewportId} = useViewportId();

	const viewport = useShapeDiverStoreViewport(
		(state) => state.viewports[viewportId],
	);

	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
	const [canvasWidth, setCanvasWidth] = useState<number>(0);
	const [canvasHeight, setCanvasHeight] = useState<number>(0);

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
			const vertical = justification?.[0] || "M";
			// second letter is horizontal
			const horizontal = justification?.[1] || "C";

			let x, y;
			if (horizontal === "R") {
				x =
					properties.container[0] * (1 / properties.scale[0]) -
					portalRef.current.offsetWidth;
			} else if (horizontal === "L") {
				x = properties.container[0] * (1 / properties.scale[0]);
			} else {
				x =
					properties.container[0] * (1 / properties.scale[0]) -
					portalRef.current.offsetWidth / 2;
			}

			if (vertical === "B") {
				y = properties.container[1] * (1 / properties.scale[1]);
			} else if (vertical === "T") {
				y =
					properties.container[1] * (1 / properties.scale[1]) -
					portalRef.current.offsetHeight;
			} else {
				y =
					properties.container[1] * (1 / properties.scale[1]) -
					portalRef.current.offsetHeight / 2;
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
							width: "max-content",
						}}
					>
						<Group
							color="inherit"
							style={{
								maxWidth: "var(--app-shell-navbar-width)",
								pointerEvents:
									allowPointerEvents === false
										? "none"
										: "auto",
							}}
						>
							{element}
						</Group>
					</Group>
				</Group>
			</Portal>
		)
	);
}
