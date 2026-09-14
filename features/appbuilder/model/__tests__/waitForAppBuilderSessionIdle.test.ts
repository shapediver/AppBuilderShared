/**
 * @jest-environment jsdom
 */
import {useShapeDiverStoreProcessManager} from "@AppBuilderLib/shared/model/useShapeDiverStoreProcessManager";
import {waitForAppBuilderSessionIdle} from "../waitForAppBuilderSessionIdle";

describe("waitForAppBuilderSessionIdle", () => {
	afterEach(() => {
		const {processManagers, removeProcessManager} =
			useShapeDiverStoreProcessManager.getState();
		Object.keys(processManagers).forEach((id) => removeProcessManager(id));
	});

	it("resolves immediately when no process is running", async () => {
		await expect(waitForAppBuilderSessionIdle()).resolves.toBeUndefined();
	});

	it("waits until running processes finish", async () => {
		const {createProcessManager, addProcess} =
			useShapeDiverStoreProcessManager.getState();
		const processManagerId = createProcessManager("session");
		let resolveProcess: () => void = () => {};
		const processPromise = new Promise<void>((resolve) => {
			resolveProcess = resolve;
		});
		addProcess(processManagerId, {
			name: "session work",
			promise: processPromise,
		});

		let resolved = false;
		const idle = waitForAppBuilderSessionIdle().then(() => {
			resolved = true;
		});

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(resolved).toBe(false);

		resolveProcess();
		await idle;
		expect(resolved).toBe(true);
	});
});
