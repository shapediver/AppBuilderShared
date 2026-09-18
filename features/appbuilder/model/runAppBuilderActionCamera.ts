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
import {Logger} from "@AppBuilderLib/shared/lib/logger";
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

function failCamera(strict: boolean | undefined, message: string): void {
	if (strict) {
		throw new Error(message);
	}
	Logger.warn(message);
}

function isCameraType(value: unknown): value is CAMERA_TYPE {
	return (
		typeof value === "string" &&
		(Object.values(CAMERA_TYPE) as string[]).includes(value)
	);
}

function findViewportCamera(
	viewportApi: IViewportApi,
	camera: Record<string, unknown>,
): ICameraApi | undefined {
	if (typeof camera.id === "string") {
		const id = camera.id;
		const byId = Object.entries(viewportApi.cameras).find(
			([key, value]) => value.id === id || key === id,
		);
		if (byId) {
			return byId[1];
		}
	}

	if (typeof camera.name === "string") {
		const name = camera.name.toLowerCase();
		const byName = Object.entries(viewportApi.cameras).find(
			([key, value]) => {
				if (value.name?.toLowerCase() === name) {
					return true;
				}
				if (!value.name && key.toLowerCase() === name) {
					return true;
				}
				return false;
			},
		);
		if (byName) {
			return byName[1];
		}
	}

	return undefined;
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
	strict?: boolean,
): Promise<void> {
	if (!viewportApi.camera) return;

	let newCamera: ICameraApi | undefined;
	if (props.props.camera) {
		const camera = props.props.camera as Record<string, unknown>;
		const skipKeys: string[] = [];
		const existingCamera = findViewportCamera(viewportApi, camera);

		if (existingCamera) {
			viewportApi.assignCamera(existingCamera.id);
			if (camera.id) skipKeys.push("id");
			if (camera.name) skipKeys.push("name");
			newCamera = existingCamera;
		} else if (
			isAssignCameraAction(props) &&
			!camera.type &&
			(camera.id || camera.name)
		) {
			failCamera(
				strict,
				`Camera "${String(camera.id ?? camera.name)}" not found.`,
			);
			return;
		}

		if (!newCamera && camera.type) {
			if (!isCameraType(camera.type)) {
				failCamera(
					strict,
					`Invalid camera type "${String(camera.type)}".`,
				);
				return;
			}
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

	if (isAssignCameraAction(props) && !newCamera) {
		failCamera(strict, "Camera assign requires id, name, or type.");
		return;
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
			failCamera(
				strict,
				"Camera set action requires position and target.",
			);
			return;
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
		failCamera(context.strict, "Viewport not found.");
		return;
	}
	await applyCameraAction(viewportApi, definition.props, context.strict);
}
