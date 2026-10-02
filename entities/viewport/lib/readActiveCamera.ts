import {z} from "@AppBuilderLib/shared/lib/zod";
import {
	CAMERA_TYPE,
	ORTHOGRAPHIC_CAMERA_DIRECTION,
} from "@shapediver/viewer.shared.types";

const vec3TupleSchema = z.tuple([z.number(), z.number(), z.number()]);

/** Camera document returned by get_camera. A live camera always has a type. */
export const activeCameraSchema = z.strictObject({
	id: z.string().optional(),
	name: z.string().optional(),
	type: z.enum(CAMERA_TYPE),
	position: vec3TupleSchema,
	target: vec3TupleSchema,
	fov: z.number().optional(),
	direction: z.enum(ORTHOGRAPHIC_CAMERA_DIRECTION).optional(),
});

export type ActiveCamera = z.infer<typeof activeCameraSchema>;

/** set_camera input. Every field is optional, as on the viewer assign action. */
export type CameraToAssign = Partial<ActiveCamera>;

type ReadableCamera = {
	id: string;
	name?: string;
	type: CAMERA_TYPE;
	position: ArrayLike<number>;
	target: ArrayLike<number>;
	fov?: number;
	direction?: ORTHOGRAPHIC_CAMERA_DIRECTION;
};

function vec3Tuple(value: ArrayLike<number>): [number, number, number] {
	return [value[0], value[1], value[2]];
}

type ActiveCameraRef = {
	id: string;
	type: CAMERA_TYPE;
};

/**
 * Document passed to the assign-camera action.
 * An id or name selects that camera. With neither, the active camera is
 * updated. A different type is left so assign can create that camera.
 * `type` is omitted on an update, so an unknown id or name fails
 * instead of creating another camera.
 */
export function activeCameraForAssign(
	camera: CameraToAssign,
	activeCamera?: ActiveCameraRef,
): CameraToAssign {
	const hasSelector = Boolean(camera.id || camera.name);
	const hasChange =
		camera.position !== undefined ||
		camera.target !== undefined ||
		camera.fov !== undefined ||
		camera.direction !== undefined ||
		camera.type !== undefined;
	const typeAgrees =
		camera.type === undefined || camera.type === activeCamera?.type;
	const updateActive =
		!hasSelector && hasChange && typeAgrees && Boolean(activeCamera?.id);
	const id = updateActive ? activeCamera?.id : camera.id;

	const document: CameraToAssign = {};
	if (id) document.id = id;
	if (camera.name) document.name = camera.name;
	if (camera.position !== undefined) document.position = camera.position;
	if (camera.target !== undefined) document.target = camera.target;
	if (!updateActive && !hasSelector && camera.type !== undefined) {
		document.type = camera.type;
	}
	if (camera.fov !== undefined) document.fov = camera.fov;
	if (camera.direction !== undefined) document.direction = camera.direction;

	return document;
}

export type CameraMove = {
	position: [number, number, number];
	target: [number, number, number];
};

/**
 * Assign payload plus an animated move.
 * Position and target are taken off the assign document when both can be
 * resolved, so `camera.set` can animate them instead of assign snapping.
 */
export function planCameraUpdate(
	camera: CameraToAssign,
	activeCamera?: ActiveCameraRef & {
		position?: [number, number, number];
		target?: [number, number, number];
	},
): {assign: CameraToAssign; move?: CameraMove} {
	const assign = activeCameraForAssign(camera, activeCamera);
	const wantsMove =
		camera.position !== undefined || camera.target !== undefined;
	const position = camera.position ?? activeCamera?.position;
	const target = camera.target ?? activeCamera?.target;
	if (!wantsMove || position === undefined || target === undefined) {
		return {assign};
	}
	const rest: CameraToAssign = {...assign};
	delete rest.position;
	delete rest.target;
	return {assign: rest, move: {position, target}};
}

/** Copy the active viewport camera into a plain document. */
export function readActiveCamera(
	camera: ReadableCamera | null | undefined,
): ActiveCamera | undefined {
	if (!camera) return undefined;
	return {
		id: camera.id,
		type: camera.type,
		position: vec3Tuple(camera.position),
		target: vec3Tuple(camera.target),
		...(camera.name ? {name: camera.name} : {}),
		...(camera.fov !== undefined ? {fov: camera.fov} : {}),
		...(camera.direction !== undefined
			? {direction: camera.direction}
			: {}),
	};
}
