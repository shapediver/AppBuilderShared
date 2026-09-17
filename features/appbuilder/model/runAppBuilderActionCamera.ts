import {findNodesByNameFilter} from "@AppBuilderLib/entities/parameter/lib/findNodesByNameFilter";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {
	IAppBuilderActionDefinition,
	IAppBuilderActionPropsCamera,
	isAnimateCameraAction,
	isAssignCameraAction,
	isCameraAction,
	isResetCameraAction,
	isSetCameraAction,
	isZoomToCameraAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {
	Box,
	CAMERA_TYPE,
	IBox,
	ICameraApi,
	IOrthographicCameraApi,
	IViewportApi,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
} from "@shapediver/viewer.viewport";
import {vec3} from "gl-matrix";

const toVec3 = (value?: ArrayLike<number>) =>
	value && value.length >= 3
		? vec3.fromValues(value[0], value[1], value[2])
		: undefined;

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
	} else if (vec3.equals(newPosition, newTarget)) {
		newPosition[0] += 0.0001;
		newPosition[1] += 0.0001;
		newPosition[2] += 0.0001;
	}

	return {position: newPosition, target: newTarget};
};

async function applyCameraAction(
	viewportApi: IViewportApi,
	props: IAppBuilderActionPropsCamera,
): Promise<void> {
	if (!viewportApi.camera) return;

	let newCamera: ICameraApi | undefined;
	if (props.props.camera) {
		const camera = props.props.camera as Record<string, unknown>;
		const skipKeys: string[] = [];

		if (camera.name) {
			const existingCamera = Object.entries(viewportApi.cameras).find(
				([key, value]) => {
					if (
						value.name?.toLowerCase() ===
						(camera.name as string).toLowerCase()
					) {
						return true;
					}
					if (
						!value.name &&
						key.toLowerCase() ===
							(camera.name as string).toLowerCase()
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
			} else if (isAssignCameraAction(props) && !camera.type) {
				throw new Error(`Camera "${String(camera.name)}" not found.`);
			}
		}

		if (!newCamera && camera.type) {
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
					toVec3(camera.position as ArrayLike<number> | undefined),
					toVec3(camera.target as ArrayLike<number> | undefined),
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
					(newCamera as unknown as Record<string, unknown>)[key] =
						camera[key];
				}
			});
		}
	}

	if (isAnimateCameraAction(props)) {
		const {path, startFromCurrent, options} = props.props;
		const cameraPath: {
			position: [number, number, number];
			target: [number, number, number];
		}[] =
			startFromCurrent !== false
				? [
						{
							position: [
								viewportApi.camera.position[0],
								viewportApi.camera.position[1],
								viewportApi.camera.position[2],
							],
							target: [
								viewportApi.camera.target[0],
								viewportApi.camera.target[1],
								viewportApi.camera.target[2],
							],
						},
						...path,
					]
				: path;

		await viewportApi.camera.animate(
			cameraPath.map((point) =>
				cleanCameraPositionAndTarget(
					viewportApi.camera!,
					toVec3(point.position),
					toVec3(point.target),
				),
			),
			options,
		);
		return;
	}

	if (isSetCameraAction(props)) {
		const {
			position: inputPosition,
			target: inputTarget,
			options,
		} = props.props;
		if (!inputPosition || !inputTarget) {
			throw new Error("Camera set action requires position and target.");
		}
		const {position, target} = cleanCameraPositionAndTarget(
			viewportApi.camera,
			toVec3(inputPosition),
			toVec3(inputTarget),
		);
		await viewportApi.camera.set(position, target, options);
		return;
	}

	if (isResetCameraAction(props)) {
		await viewportApi.camera.reset(props.props.options);
		return;
	}

	if (isZoomToCameraAction(props)) {
		const {
			initialPosition: inputInitialPosition,
			initialTarget: inputInitialTarget,
			options,
			nameFilter,
		} = props.props;
		const {position: initialPosition, target: initialTarget} =
			cleanCameraPositionAndTarget(
				viewportApi.camera,
				toVec3(inputInitialPosition),
				toVec3(inputInitialTarget),
			);

		let boundingBox: IBox | undefined;
		if (nameFilter?.length) {
			for (const node of findNodesByNameFilter(nameFilter)) {
				if (!boundingBox) boundingBox = new Box();
				boundingBox.union(node.boundingBox);
			}
		}

		const {position, target} = viewportApi.camera.calculateZoomTo(
			boundingBox,
			inputInitialPosition ? initialPosition : undefined,
			inputInitialTarget ? initialTarget : undefined,
		);
		await viewportApi.camera.set(position, target, options);
	}
}

/** ShapeDiver-viewer camera executor. Register from the host `componentContext`. */
export async function runAppBuilderActionCamera(
	definition: IAppBuilderActionDefinition,
	context: AppBuilderActionRunContext,
): Promise<void> {
	if (!isCameraAction(definition)) return;

	const viewportId =
		definition.props.viewportId ?? resolvedViewportId(context);
	const viewportApi =
		useShapeDiverStoreViewport.getState().viewports[viewportId];
	if (!viewportApi?.camera) {
		throw new Error("Viewport not found.");
	}
	await applyCameraAction(viewportApi, definition.props);
}
