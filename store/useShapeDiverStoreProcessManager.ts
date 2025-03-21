import {
	IProcess,
	IProcessManager,
	IShapeDiverStoreProcessManager,
} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {FLAG_TYPE} from "@shapediver/viewer.session";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {devtoolsSettings} from "./storeSettings";
import {useShapeDiverStoreViewport} from "./useShapeDiverStoreViewport";

export class ProcessManager implements IProcessManager {
	readonly _id: string;
	readonly _processes: IProcess[] = [];
	readonly _busyModeFlagTokens: {
		[key: string]: string;
	} = {};
	readonly _suspendSceneUpdateFlagTokens: {
		[key: string]: string;
	} = {};

	constructor(id: string) {
		this._id = id;
		// evaluate the processes when the process manager is created
		// this is necessary to already set the flags for the viewports
		this.evaluateProcesses();
	}

	public get id(): string {
		return this._id;
	}

	public get processes(): IProcess[] {
		return this._processes;
	}

	public addPromise(promise: Promise<unknown>): void {
		const process: IProcess = {
			resolved: false,
			promise,
		};

		// once the promise is resolved, set the resolved flag to true
		// and evaluate the processes
		process.promise.then(() => {
			process.resolved = true;
			this.evaluateProcesses();
		});

		this.processes.push(process);
		this.evaluateProcesses();
	}

	/**
	 * Evaluates the processes.
	 *
	 * If there are no registered processes or if there are still running processes,
	 * it sets the busy mode and suspend scene update flags for all viewports.
	 *
	 * If all processes have been resolved, it removes the flags from the viewports
	 * and removes itself from the store.
	 */
	private evaluateProcesses(): void {
		// TODO: abstraction for WebGI
		// we shouldn't use the viewports directly here
		// we should have a function that sets the flags for all viewports

		const {viewports} = useShapeDiverStoreViewport.getState();

		const noRegisteredProcesses = this.processes.length === 0;

		let stillRunning = false;
		this.processes.forEach((process) => {
			if (process.resolved === false) stillRunning = true;
		});

		// if there are no registered processes or if there are still running processes
		// set the busy mode and suspend scene update flags for all viewports (if not already set)
		if (noRegisteredProcesses || stillRunning) {
			// check if viewports already have the flags, if not, add them
			for (const token in viewports) {
				if (!this._busyModeFlagTokens[token]) {
					this._busyModeFlagTokens[token] = viewports[token].addFlag(
						FLAG_TYPE.BUSY_MODE,
					);
				}
				if (!this._suspendSceneUpdateFlagTokens[token]) {
					this._suspendSceneUpdateFlagTokens[token] = viewports[
						token
					].addFlag(FLAG_TYPE.SUSPEND_SCENE_UPDATES);
				}
			}
		} else {
			// remove busy flags from all viewports
			for (const token in this._busyModeFlagTokens) {
				if (viewports[token]) {
					viewports[token].removeFlag(
						this._busyModeFlagTokens[token],
					);
				}
			}

			// remove suspend scene update flags from all viewports
			for (const token in this._suspendSceneUpdateFlagTokens) {
				if (viewports[token]) {
					viewports[token].removeFlag(
						this._suspendSceneUpdateFlagTokens[token],
					);
				}
			}

			// remove from store, the process manager is no longer needed
			useShapeDiverStoreProcessManager.setState((state) => {
				if (!state.processManagers[this.id]) return state;

				const processManagers = {...state.processManagers};
				delete processManagers[this.id];

				return {...state, processManagers};
			});
		}
	}
}

export const useShapeDiverStoreProcessManager =
	create<IShapeDiverStoreProcessManager>()(
		devtools(
			(set) => ({
				processManagers: {},
				addPromise: (processId: string, promise: Promise<unknown>) => {
					set((state) => {
						const processManagers = {...state.processManagers};
						const processManager =
							processManagers[processId] ??
							new ProcessManager(processId);

						processManager.addPromise(promise);

						return {
							...state,
							processManagers: {
								...processManagers,
								[processId]: processManager,
							},
						};
					});
				},
				createProcessManager: (processId: string) => {
					set((state) => {
						const processManagers = {...state.processManagers};
						const processManager =
							processManagers[processId] ??
							new ProcessManager(processId);

						return {
							...state,
							processManagers: {
								...processManagers,
								[processId]: processManager,
							},
						};
					});
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | Viewer"},
		),
	);
