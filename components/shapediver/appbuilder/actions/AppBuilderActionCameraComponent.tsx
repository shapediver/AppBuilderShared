import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useCreateNameFilterPattern} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useCreateNameFilterPattern";
import {
	IUseFindNodesByPatternProps,
	useFindNodesByPatterns,
} from "@AppBuilderShared/hooks/shapediver/viewer/interaction/useFindNodesByPattern";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreViewport} from "@AppBuilderShared/store/useShapeDiverStoreViewport";
import {
	IAppBuilderActionPropsCamera,
	isAnimateCameraAction,
	isAssignCameraAction,
	isResetCameraAction,
	isSetCameraAction,
	isZoomToCameraAction,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	Box,
	CAMERA_TYPE,
	IBox,
	ICameraApi,
	IOrthographicCameraApi,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
} from "@shapediver/viewer.viewport";
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
		if (isAssignCameraAction(props)) return "Assign camera";
		if (isSetCameraAction(props)) return "Set camera";
		if (isResetCameraAction(props)) return "Reset camera";
		if (isZoomToCameraAction(props)) return "Zoom extents";
		return "Start camera";
	}, [props]);

	const nameFilter = useMemo(() => {
		if (isZoomToCameraAction(props)) {
			return {nameFilter: props.props.nameFilter || []};
		}
		return {nameFilter: []};
	}, [props]);

	// create the patterns for the geometry restrictions based on the filter patterns
	const {patterns} = useCreateNameFilterPattern(nameFilter);

	// create a map of the patterns by the restriction ID, session ID, and output ID
	const patternsByKeys: {[key: string]: IUseFindNodesByPatternProps} =
		useMemo(() => {
			const patternsByKeys: {[key: string]: IUseFindNodesByPatternProps} =
				{};
			if (patterns.instancePatterns) {
				Object.entries(patterns.instancePatterns).forEach(
					([instanceId, pattern]) => {
						patternsByKeys[`${instanceId}`] = {
							instanceId,
							patterns: pattern,
						};
					},
				);
			}

			if (patterns.outputPatterns) {
				Object.entries(patterns.outputPatterns).forEach(
					([sessionId, pattern]) => {
						Object.entries(pattern).forEach(
							([outputId, pattern]) => {
								patternsByKeys[`${sessionId}_${outputId}`] = {
									sessionId,
									outputId: outputId,
									patterns: pattern,
								};
							},
						);
					},
				);
			}

			return patternsByKeys;
		}, [patterns]);

	// get the nodes based on the patterns
	const {nodes} = useFindNodesByPatterns(patternsByKeys);

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
				if (camera.position || camera.target) {
					const {position, target} = cleanCameraPositionAndTarget(
						newCamera,
						camera.position,
						camera.target,
					);
					newCamera.position = position;
					newCamera.target = target;
				}

				Object.keys(camera).forEach((key) => {
					if (
						key !== "type" &&
						key !== "position" &&
						key !== "target" &&
						!skipKeys.includes(key)
					) {
						// @ts-ignore
						newCamera[key] = (camera as Record<string, any>)[key];
					}
				});
			}
		}

		if (isAnimateCameraAction(props)) {
			const {path, options} = props.props;
			await viewportApi.camera.animate(
				path.map((p) =>
					cleanCameraPositionAndTarget(
						viewportApi.camera!,
						p.position ? vec3.fromValues(...p.position) : undefined,
						p.target ? vec3.fromValues(...p.target) : undefined,
					),
				),
				options,
			);
		} else if (isSetCameraAction(props)) {
			const {
				position: inputPosition,
				target: inputTarget,
				options,
			} = props.props;

			const {position, target} = cleanCameraPositionAndTarget(
				viewportApi.camera,
				inputPosition ? vec3.fromValues(...inputPosition) : undefined,
				inputTarget ? vec3.fromValues(...inputTarget) : undefined,
			);
			await viewportApi.camera.set(position, target, options);
		} else if (isResetCameraAction(props)) {
			const {options} = props.props;
			await viewportApi.camera.reset(options);
		} else if (isZoomToCameraAction(props)) {
			const {
				initialPosition: inputInitialPosition,
				initialTarget: inputInitialTarget,
				options,
			} = props.props;
			const {position: initialPosition, target: initialTarget} =
				cleanCameraPositionAndTarget(
					viewportApi.camera,
					inputInitialPosition
						? vec3.fromValues(...inputInitialPosition)
						: undefined,
					inputInitialTarget
						? vec3.fromValues(...inputInitialTarget)
						: undefined,
				);

			let bb: IBox | undefined = undefined;
			Object.entries(nodes).forEach(([key, data]) => {
				data.forEach((node) => {
					if (!bb) bb = new Box();
					bb.union(node.boundingBox);
				});
			});

			const {position, target} = viewportApi.camera.calculateZoomTo(
				bb,
				inputInitialPosition ? initialPosition : undefined,
				inputInitialTarget ? initialTarget : undefined,
			);
			await viewportApi.camera.set(position, target, options);
		}

		setLoading(false);
	}, [viewportApi, nodes, props]);

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

const cleanCameraPositionAndTarget = (
	camera: ICameraApi,
	position: vec3 | undefined,
	target: vec3 | undefined,
) => {
	let newPosition = position ? position : camera.position;
	const newTarget = target ? target : camera.target;

	if (
		camera.type === CAMERA_TYPE.ORTHOGRAPHIC &&
		(camera as IOrthographicCameraApi).direction !==
			ORTHOGRAPHIC_CAMERA_DIRECTION.CUSTOM
	) {
		const direction = (camera as IOrthographicCameraApi).direction;

		switch (direction) {
			case ORTHOGRAPHIC_CAMERA_DIRECTION.TOP:
				newPosition = vec3.fromValues(
					newTarget[0],
					newTarget[1],
					newPosition[2] > newTarget[2]
						? newPosition[2]
						: -newPosition[2],
				);
				break;
			case ORTHOGRAPHIC_CAMERA_DIRECTION.BOTTOM:
				newPosition = vec3.fromValues(
					newTarget[0],
					newTarget[1],
					newPosition[2] < newTarget[2]
						? newPosition[2]
						: -newPosition[2],
				);
				break;
			case ORTHOGRAPHIC_CAMERA_DIRECTION.LEFT:
				newPosition = vec3.fromValues(
					newPosition[0] < newTarget[0]
						? newPosition[0]
						: -newPosition[0],
					newTarget[1],
					newTarget[2],
				);
				break;
			case ORTHOGRAPHIC_CAMERA_DIRECTION.RIGHT:
				newPosition = vec3.fromValues(
					newPosition[0] > newTarget[0]
						? newPosition[0]
						: -newPosition[0],
					newTarget[1],
					newTarget[2],
				);
				break;
			case ORTHOGRAPHIC_CAMERA_DIRECTION.FRONT:
				newPosition = vec3.fromValues(
					newTarget[0],
					newPosition[1] < newTarget[1]
						? newPosition[1]
						: -newPosition[1],
					newTarget[2],
				);
				break;
			case ORTHOGRAPHIC_CAMERA_DIRECTION.BACK:
				newPosition = vec3.fromValues(
					newTarget[0],
					newPosition[1] > newTarget[1]
						? newPosition[1]
						: -newPosition[1],
					newTarget[2],
				);
				break;
		}
	} else {
		// if the position and target are the same, move the position slightly to avoid issues with the camera
		if (vec3.equals(newPosition, newTarget)) {
			newPosition[0] += 0.0001;
			newPosition[1] += 0.0001;
			newPosition[2] += 0.0001;
		}
	}

	return {position: newPosition, target: newTarget};
};
