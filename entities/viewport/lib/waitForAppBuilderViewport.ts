import type {IViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/config/shapediverStoreViewportAccessFunctions";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderLib/entities/viewport/model/useShapeDiverStoreViewportAccessFunctions";

/**
 * Viewport readiness used by `appready`. Looks up
 * `viewportAccessFunctions.waitUntilReady` after the host registers access
 * functions. ShapeDiver fills that slot from `entities/viewport/lib/waitUntilReady`.
 *
 * This module must not import `useShapeDiverStoreViewport` /
 * `@shapediver/viewer.viewport`. `AppBuilderPage` always loads it, including
 * hosts that do not depend on the ShapeDiver viewport package.
 */

export type WaitForViewportOptions = {
	signal?: AbortSignal;
	/**
	 * When false, skip waiting (hosts that do not register a viewport).
	 * Defaults to true.
	 */
	waitForScene?: boolean;
};

function accessFunctionsFor(
	viewportId: string,
): IViewportAccessFunctions | undefined {
	return useShapeDiverStoreViewportAccessFunctions.getState()
		.viewportAccessFunctions[viewportId];
}

async function waitForViewportRegistration(
	viewportId: string,
	signal?: AbortSignal,
): Promise<IViewportAccessFunctions | undefined> {
	const current = accessFunctionsFor(viewportId);
	if (current || signal?.aborted) {
		return current;
	}

	return new Promise((resolve) => {
		let settled = false;
		const store = {unsubscribe: undefined as (() => void) | undefined};

		const finish = (value?: IViewportAccessFunctions) => {
			if (settled) return;
			settled = true;
			store.unsubscribe?.();
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
			if (access) finish(access);
		};

		store.unsubscribe =
			useShapeDiverStoreViewportAccessFunctions.subscribe(tryFinish);
		tryFinish();
	});
}

/**
 * Wait until the viewport is ready for visibility-dependent actions (`appready`
 * camera/AR). Uses `viewportAccessFunctions.waitUntilReady` so hosts such as
 * iJewel/WebGi can replace ShapeDiver scene-bbox waiting with native
 * visibility. ShapeDiver registers `waitUntilReady` from `useViewport`.
 *
 * Does not consult the ShapeDiver viewport store: both hosts register access
 * functions; waiting for that registration is the dual-host path.
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
	}
}
