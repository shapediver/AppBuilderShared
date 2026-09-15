import type {IViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/config/shapediverStoreViewportAccessFunctions";
import {useShapeDiverStoreViewport} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewport";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";
import {
	addListener,
	EVENTTYPE_SCENE,
	EVENTTYPE_VIEWPORT,
	type ISceneEvent,
	type IViewportEvent,
	removeListener,
	sceneTree,
	sessions,
} from "@shapediver/viewer.session";

export type WaitForViewportOptions = {
	signal?: AbortSignal;
	/**
	 * When false, skip waiting (hosts that do not register a viewport).
	 * Defaults to true.
	 */
	waitForScene?: boolean;
};

function viewportExists(viewportId: string): boolean {
	return !!useShapeDiverStoreViewport.getState().viewports[viewportId];
}

function accessFunctionsFor(
	viewportId: string,
): IViewportAccessFunctions | undefined {
	return useShapeDiverStoreViewportAccessFunctions.getState()
		.viewportAccessFunctions[viewportId];
}

function sceneHasGeometry(): boolean {
	return !sceneTree.root.boundingBox.isEmpty();
}

function sessionsHaveLoadedNodes(): boolean {
	const loaded = Object.values(sessions);
	return loaded.length > 0 && loaded.every((session) => !!session.node);
}

/**
 * Empty-AABB test for `SCENE_BOUNDING_BOX_CHANGE` payloads.
 * Viewer empty boxes use min > max (typically ±Infinity).
 */
function isEmptyEventBoundingBox(
	boundingBox: ISceneEvent["boundingBox"] | undefined,
): boolean {
	if (!boundingBox?.min || !boundingBox?.max) return true;
	return (
		boundingBox.min[0] > boundingBox.max[0] ||
		boundingBox.min[1] > boundingBox.max[1] ||
		boundingBox.min[2] > boundingBox.max[2]
	);
}

function isViewportEvent(
	event: unknown,
	viewportId: string,
): event is IViewportEvent {
	return (
		!!event &&
		typeof event === "object" &&
		(event as IViewportEvent).viewportId === viewportId
	);
}

/**
 * Scene is ready for camera/AR (`zoomTo` / `viewInAR`):
 * - non-empty scene bbox (geometry present), or
 * - viewer `scene.boundingBoxEmpty` (no geometry, initial outputs loaded).
 *
 * `calculateZoomTo` no-ops on an empty box, so running `zoomTo` before either
 * event uses a still-loading empty scene and never frames later geometry.
 */
function isSceneReady(
	viewportId: string,
	emptyConfirmed: boolean,
	geometryConfirmed: boolean,
): boolean {
	if (!viewportExists(viewportId)) return false;
	if (sceneHasGeometry() || geometryConfirmed) return true;
	if (emptyConfirmed) return true;
	return sessionsHaveLoadedNodes();
}

/**
 * ShapeDiver default for `IViewportAccessFunctions.waitUntilReady`.
 * Waits until the viewport is in the store and the scene bounding box has
 * settled. No timeout — uses `viewport.created`, `scene.boundingBoxChange`,
 * and `scene.boundingBoxEmpty`.
 */
export async function waitForViewportScene(
	viewportId: string,
	options: Pick<WaitForViewportOptions, "signal"> = {},
): Promise<void> {
	const {signal} = options;
	if (signal?.aborted) return;
	if (viewportExists(viewportId) && sceneHasGeometry()) return;

	await new Promise<void>((resolve) => {
		let settled = false;
		let emptyConfirmed = false;
		let geometryConfirmed = false;
		const tokens: string[] = [];
		const store = {unsubscribe: undefined as (() => void) | undefined};

		const finish = () => {
			if (settled) return;
			settled = true;
			tokens.forEach((token) => removeListener(token));
			store.unsubscribe?.();
			signal?.removeEventListener("abort", finish);
			resolve();
		};

		if (signal?.aborted) {
			finish();
			return;
		}
		signal?.addEventListener("abort", finish);

		const tryFinish = () => {
			if (isSceneReady(viewportId, emptyConfirmed, geometryConfirmed))
				finish();
		};

		tokens.push(
			addListener(EVENTTYPE_VIEWPORT.VIEWPORT_CREATED, (event) => {
				if (isViewportEvent(event, viewportId)) tryFinish();
			}),
		);
		tokens.push(
			addListener(EVENTTYPE_SCENE.SCENE_BOUNDING_BOX_CHANGE, (event) => {
				if (!isViewportEvent(event, viewportId)) return;
				if (
					!isEmptyEventBoundingBox((event as ISceneEvent).boundingBox)
				) {
					geometryConfirmed = true;
					tryFinish();
				}
			}),
		);
		tokens.push(
			addListener(EVENTTYPE_SCENE.SCENE_BOUNDING_BOX_EMPTY, (event) => {
				if (!isViewportEvent(event, viewportId)) return;
				emptyConfirmed = true;
				tryFinish();
			}),
		);

		store.unsubscribe = useShapeDiverStoreViewport.subscribe(() => {
			tryFinish();
		});

		tryFinish();
	});
}

async function waitForViewportRegistration(
	viewportId: string,
	signal?: AbortSignal,
): Promise<IViewportAccessFunctions | undefined> {
	const current = accessFunctionsFor(viewportId);
	if (current || viewportExists(viewportId) || signal?.aborted) {
		return current;
	}

	return new Promise((resolve) => {
		let settled = false;
		const store = {
			access: undefined as (() => void) | undefined,
			viewport: undefined as (() => void) | undefined,
		};

		const finish = (value?: IViewportAccessFunctions) => {
			if (settled) return;
			settled = true;
			store.access?.();
			store.viewport?.();
			signal?.removeEventListener("abort", onAbort);
			resolve(value);
		};

		const onAbort = () => finish(accessFunctionsFor(viewportId));

		if (signal?.aborted) {
			finish(accessFunctionsFor(viewportId));
			return;
		}
		signal?.addEventListener("abort", onAbort);

		const tryFinish = () => {
			const access = accessFunctionsFor(viewportId);
			if (access || viewportExists(viewportId)) finish(access);
		};

		store.access =
			useShapeDiverStoreViewportAccessFunctions.subscribe(tryFinish);
		store.viewport = useShapeDiverStoreViewport.subscribe(tryFinish);
		tryFinish();
	});
}

/**
 * Wait until the viewport is ready for visibility-dependent actions (`appready`
 * camera/AR). Prefers `viewportAccessFunctions.waitUntilReady` so hosts such as
 * iJewel/WebGi can replace ShapeDiver scene-bbox waiting with native
 * visibility. ShapeDiver registers {@link waitForViewportScene} from
 * `useViewport`.
 */
export async function waitForAppBuilderViewport(
	viewportId: string,
	options: WaitForViewportOptions = {},
): Promise<void> {
	const {signal, waitForScene = true} = options;
	if (!waitForScene || signal?.aborted) return;

	const access = await waitForViewportRegistration(viewportId, signal);
	if (signal?.aborted) return;

	if (access?.waitUntilReady) {
		await access.waitUntilReady(signal);
		return;
	}

	if (viewportExists(viewportId)) {
		await waitForViewportScene(viewportId, {signal});
	}
}
