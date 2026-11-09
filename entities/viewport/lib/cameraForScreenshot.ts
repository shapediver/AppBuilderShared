/**
 * Default viewer cameras have an id (`front`) and no `name`.
 * The camera action matches a display name such as `Front` to that id.
 * `getScreenshotAdvanced` looks up `cameras[name]` and `camera.name` only,
 * so the same display name stays on the active camera.
 */

type CameraWithId = {
	id: string;
	name?: string;
};

/** Match a camera selector the same way as the camera action. */
export function findViewportCamera<T extends CameraWithId>(
	cameras: Record<string, T>,
	camera: {id?: unknown; name?: unknown},
): T | undefined {
	if (typeof camera.id === "string") {
		const id = camera.id;
		const byId = Object.entries(cameras).find(
			([key, value]) => value.id === id || key === id,
		);
		if (byId) {
			return byId[1];
		}
	}

	if (typeof camera.name === "string") {
		return findCameraByName(cameras, camera.name);
	}

	return undefined;
}

/**
 * A camera whose `name` equals the requested text wins, then one whose
 * id equals it. Case-insensitive matches come after that, so `Front`
 * selects a camera named `Front` when a default camera id `front` also exists,
 * and `front` still selects that default camera.
 */
function findCameraByName<T extends CameraWithId>(
	cameras: Record<string, T>,
	requested: string,
): T | undefined {
	const entries = Object.entries(cameras);
	const exactName = entries.find(([, value]) => value.name === requested);
	if (exactName) return exactName[1];

	const exactId = entries.find(
		([key, value]) =>
			!value.name && (value.id === requested || key === requested),
	);
	if (exactId) return exactId[1];

	const folded = requested.toLowerCase();
	const foldedName = entries.find(
		([, value]) =>
			value.name !== undefined && value.name.toLowerCase() === folded,
	);
	if (foldedName) return foldedName[1];

	return entries.find(
		([key, value]) => !value.name && key.toLowerCase() === folded,
	)?.[1];
}

/**
 * Camera document for `getScreenshotAdvanced`.
 * A matched camera is passed by its id, which is the viewer's lookup key.
 * An unmatched camera is left unchanged so a `type` can still create one.
 */
export function cameraForScreenshot<T extends {id?: string; name?: string}>(
	cameras: Record<string, CameraWithId> | undefined,
	camera: T | undefined,
): T | undefined {
	if (!camera || !cameras) return camera;
	const existing = findViewportCamera(cameras, camera);
	if (!existing || camera.name === existing.id) return camera;
	return {...camera, name: existing.id};
}
