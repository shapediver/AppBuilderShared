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
import {CAMERA_TYPE, ICameraApi} from "@shapediver/viewer.viewport";
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

		let newCamera: ICameraApi | undefined = undefined;
		if (props.props.camera) {
			const camera = props.props.camera;

			let skipKeys: string[] = [];

			if (camera.name) {
				const existingCamera = Object.entries(viewportApi.cameras).find(
					([key, value]) => {
						// check against the name -> case insensitive
						if (
							value.name?.toLowerCase() ===
							camera.name!.toLowerCase()
						) {
							return true;
						}

						// if the camera doesn't have a name, check against the key -> case insensitive
						if (
							!value.name &&
							key.toLowerCase() === camera.name!.toLowerCase()
						) {
							return true;
						}
						return false;
					},
				);
				if (existingCamera) {
					viewportApi.assignCamera(existingCamera[1].id);
					skipKeys.push("name");
					newCamera = existingCamera[1];
				}
			}

			if (!newCamera && camera.type) {
				// create a new camera
				newCamera =
					camera.type === CAMERA_TYPE.PERSPECTIVE
						? viewportApi.createPerspectiveCamera()
						: viewportApi.createOrthographicCamera();
				viewportApi.assignCamera(newCamera.id);
			}

			if (newCamera) {
				Object.keys(camera).forEach((key) => {
					if (key !== "type" && !skipKeys.includes(key)) {
						// @ts-ignore
						newCamera[key] = (camera as Record<string, any>)[key];
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
	}, [viewportApi, props]);

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
