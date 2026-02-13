import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {
	IAppBuilderActionPropsCamera,
	isAnimateCameraAction,
	isResetCameraAction,
	isSetCameraAction,
	isZoomToCameraAction,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {CAMERA_TYPE} from "@shapediver/viewer.viewport";
import {vec3} from "gl-matrix";
import React, {useCallback, useMemo, useState} from "react";

type Props = IAppBuilderActionPropsCamera & {
	namespace: string;
};

/**
 * Functional component for a "camera" action.
 *
 * @returns
 */
export default function AppBuilderActionCameraComponent(props: Props) {
	const {icon = "tabler:video", tooltip} = props;

	const {viewportId} = useViewportId();

	const {viewportApi} = useShapeDiverStoreViewport((state) => {
		return {
			viewportApi: state.viewports[viewportId],
		};
	});

	const [loading, setLoading] = useState(false);

	const label = useMemo(() => {
		if (props.label) return props.label;
		if (isAnimateCameraAction(props)) return "Animate camera";
		if (isSetCameraAction(props)) return "Set camera";
		if (isResetCameraAction(props)) return "Reset camera";
		if (isZoomToCameraAction(props)) return "Zoom extents";
		return "Start camera";
	}, [props]);

	const onClick = useCallback(async () => {
		if (!viewportApi || !viewportApi.camera) return;
		setLoading(true);

		let newCamera: any = undefined;
		if (props.props.camera) {
			const camera = props.props.camera;

			if (camera.name) {
				if (viewportApi.camera?.name === camera.name) {
					// nothing to do, already assigned
				} else if (viewportApi.cameras[camera.name]) {
					const specifiedCamera = viewportApi.cameras[camera.name];

					viewportApi.assignCamera(specifiedCamera.id);
				}
				Object.keys(viewportApi.camera!).forEach((key) => {
					if (key !== "name") {
						if (
							(camera as Record<string, any>)[key] !== undefined
						) {
							// @ts-ignore
							viewportApi.camera[key] = (
								camera as Record<string, any>
							)[key];
						}
					}
				});
			} else if (camera.type) {
				// create a new camera
				newCamera =
					camera.type === CAMERA_TYPE.PERSPECTIVE
						? viewportApi.createPerspectiveCamera()
						: viewportApi.createOrthographicCamera();
				viewportApi.assignCamera(newCamera.id);

				// assign the properties
				Object.keys(camera).forEach((key) => {
					if (key !== "type") {
						// @ts-ignore
						(newCamera as any)[key] = (camera as any)[key];
					}
				});
			}
		}

		if (isAnimateCameraAction(props)) {
			const {path, options} = props.props;
			await viewportApi.camera.animate(
				path.map((p) => ({
					position: vec3.fromValues(...p.position),
					target: vec3.fromValues(...p.target),
				})),
				options,
			);
		} else if (isSetCameraAction(props)) {
			const {position, target, options} = props.props;
			await viewportApi.camera.set(
				position
					? vec3.fromValues(...position)
					: viewportApi.camera.position,
				target ? vec3.fromValues(...target) : viewportApi.camera.target,
				options,
			);
		} else if (isResetCameraAction(props)) {
			const {options} = props.props;
			await viewportApi.camera.reset(options);
		} else {
			const {options} = props.props;
			await viewportApi.camera.zoomTo(undefined, options);
		}

		setLoading(false);
	}, [viewportApi]);

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
			loading={loading}
		/>
	);
}
