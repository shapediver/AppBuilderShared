import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";

function hasRunningProcessManagers(): boolean {
	return Object.values(
		useShapeDiverStoreProcessManager.getState().processManagers,
	).some((manager) =>
		Object.values(manager.processes).some((process) => !process.resolved),
	);
}

/**
 * Resolves once no process manager still has unresolved work.
 * Parameter updates that go through `batchParameterValueUpdate` already await
 * session execution; this covers extra work tracked as process managers
 * (source resolution, exports, etc.).
 */
export async function waitForAppBuilderSessionIdle(): Promise<void> {
	await Promise.resolve();
	if (!hasRunningProcessManagers()) return;

	await new Promise<void>((resolve) => {
		const unsubscribe = useShapeDiverStoreProcessManager.subscribe(() => {
			if (!hasRunningProcessManagers()) {
				unsubscribe();
				resolve();
			}
		});
		if (!hasRunningProcessManagers()) {
			unsubscribe();
			resolve();
		}
	});
}
