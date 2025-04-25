import {
	IProcess,
	IProcessDefinition,
	IProcessManager,
	IProgress,
	IShapeDiverStoreProcessManager,
	PROCESS_STATUS,
} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {FLAG_TYPE} from "@shapediver/viewer.session";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {devtoolsSettings} from "./storeSettings";
import {useShapeDiverStoreViewportAccessFunctions} from "./useShapeDiverStoreViewportAccessFunctions";

export class ProcessManager implements IProcessManager {
	readonly _id: string;
	readonly _controllerSessionId: string;
	readonly _processes: {
		[key: string]: IProcess;
	} = {};
	readonly _busyModeFlagTokens: {
		[key: string]: string;
	} = {};
	readonly _suspendSceneUpdateFlagTokens: {
		[key: string]: string;
	} = {};
	readonly _callbacks: {
		[key: string]: (progress: {[key: string]: IProgress[]}) => void;
	} = {};

	_progress: {
		[key: string]: IProgress[];
	} = {};
	_error?: {
		[key: string]: Error;
	};
	_status: PROCESS_STATUS = PROCESS_STATUS.CREATED;

	constructor(controllerSessionId: string, id: string) {
		this._controllerSessionId = controllerSessionId;
		this._id = id;
		// this is necessary to already set the flags for the viewports
		this.evaluateProcesses();
	}

	public get controllerSessionId(): string {
		return this._controllerSessionId;
	}

	public get id(): string {
		return this._id;
	}

	public get processes(): {[key: string]: IProcess} {
		return this._processes;
	}

	public get progress(): {
		[key: string]: IProgress[];
	} {
		return this._progress;
	}

	public get error(): {[key: string]: Error} | undefined {
		return this._error;
	}

	public get status(): PROCESS_STATUS {
		return this._status;
	}

	public addProcess(processDefinition: IProcessDefinition): void {
		const processId =
			processDefinition.id || Math.random().toString(36).substring(7);
		const process: IProcess = {
			id: processId,
			name: processDefinition.name,
			resolved: false,
			promise: processDefinition.promise,
			progress: [
				{
					percentage: 0,
					msg: "Process started...",
				},
			],
		};

		// if an onProgress callback is provided, listen to the progress of the promise
		if (processDefinition.onProgress) {
			processDefinition.onProgress(
				(progress: {percentage: number; msg?: string}) => {
					process.progress.push(progress);
					this.evaluateProgress();
				},
			);
		}

		// once the promise is resolved, set the resolved flag to true
		// and evaluate the processes
		process.promise.then(() => {
			process.resolved = true;
			process.progress.push({
				percentage: 1,
				msg: "Process finished.",
			});
			this.evaluateProcesses();
		});

		// add a catch to the promise to handle errors
		process.promise.catch((error) => {
			process.error = error;
			process.resolved = true;
			this.evaluateProcesses();
		});

		this.processes[processId] = process;
		this.evaluateProcesses();
	}

	public addFlag(
		viewportId: string,
		addFlag?: (flag: FLAG_TYPE, token?: string) => string,
	): void {
		console.log(
			"Adding flags",
			viewportId,
			this._busyModeFlagTokens[viewportId],
		);
		if (!this._busyModeFlagTokens[viewportId] && addFlag) {
			this._busyModeFlagTokens[viewportId] = addFlag(FLAG_TYPE.BUSY_MODE);
		}
		if (!this._suspendSceneUpdateFlagTokens[viewportId] && addFlag) {
			this._suspendSceneUpdateFlagTokens[viewportId] = addFlag(
				FLAG_TYPE.SUSPEND_SCENE_UPDATES,
			);
		}
	}

	public addFlags(): void {
		const {viewportAccessFunctions} =
			useShapeDiverStoreViewportAccessFunctions.getState();
		// check if viewports already have the flags, if not, add them
		for (const viewportId in viewportAccessFunctions) {
			this.addFlag(
				viewportId,
				viewportAccessFunctions[viewportId].addFlag,
			);
		}
	}

	public notifyProgressChange(
		callback: (progress: {[key: string]: IProgress[]}) => void,
	): () => void {
		const id = Math.random().toString(36).substring(7);
		this._callbacks[id] = callback;

		return () => {
			delete this._callbacks[id];
		};
	}

	private removeFlags(): void {
		const {viewportAccessFunctions} =
			useShapeDiverStoreViewportAccessFunctions.getState();

		// remove busy flags from all viewports
		for (const viewportId in this._busyModeFlagTokens) {
			if (
				viewportAccessFunctions[viewportId] &&
				viewportAccessFunctions[viewportId].removeFlag
			) {
				viewportAccessFunctions[viewportId].removeFlag(
					this._busyModeFlagTokens[viewportId],
				);
			} else if (!viewportAccessFunctions[viewportId]) {
				// if the viewport access functions are not available yet,
				// we have to wait for them to be available
				const unsubscribe =
					useShapeDiverStoreViewportAccessFunctions.subscribe(
						(state) => {
							if (state.viewportAccessFunctions[viewportId]) {
								unsubscribe();
								if (
									state.viewportAccessFunctions[viewportId]
										.removeFlag
								) {
									state.viewportAccessFunctions[
										viewportId
									].removeFlag(
										this._busyModeFlagTokens[viewportId],
									);
								}
							}
						},
					);
			}
		}

		// remove suspend scene update flags from all viewports
		for (const viewportId in this._suspendSceneUpdateFlagTokens) {
			if (
				viewportAccessFunctions[viewportId] &&
				viewportAccessFunctions[viewportId].removeFlag
			) {
				viewportAccessFunctions[viewportId].removeFlag(
					this._suspendSceneUpdateFlagTokens[viewportId],
				);
			} else if (!viewportAccessFunctions[viewportId]) {
				// if the viewport access functions are not available yet,
				// we have to wait for them to be available
				const unsubscribe =
					useShapeDiverStoreViewportAccessFunctions.subscribe(
						(state) => {
							if (state.viewportAccessFunctions[viewportId]) {
								unsubscribe();
								if (
									state.viewportAccessFunctions[viewportId]
										.removeFlag
								) {
									state.viewportAccessFunctions[
										viewportId
									].removeFlag(
										this._suspendSceneUpdateFlagTokens[
											viewportId
										],
									);
								}
							}
						},
					);
			}
		}
	}

	private removeFromStore(): void {
		// remove from store, the process manager is no longer needed
		useShapeDiverStoreProcessManager.setState((state) => {
			if (!state.processManagers[this.id]) return state;

			const processManagers = {...state.processManagers};
			delete processManagers[this.id];

			return {...state, processManagers};
		});
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
		this.evaluateProgress();
		if (
			this._status === PROCESS_STATUS.CREATED ||
			this._status === PROCESS_STATUS.RUNNING
		) {
			// if the status is running, set the flags
			// they will not be set if they already exist
			this.addFlags();
		} else if (
			this._status === PROCESS_STATUS.FINISHED ||
			this._status === PROCESS_STATUS.ERROR
		) {
			// if the status is finished or error, remove the flags
			// and remove the process manager from the store
			this.removeFlags();
			this.removeFromStore();
		}
	}

	private evaluateProgress(): void {
		const processesList = Object.values(this.processes);

		// calculate the progress of the process manager
		this._progress = processesList.reduce(
			(acc, process) => {
				acc[process.id] = process.progress;
				return acc;
			},
			{} as {[key: string]: IProgress[]},
		);

		// check if there are still running processes
		const running =
			processesList.length > 0 &&
			processesList.some((process) => !process.resolved);

		if (running) this._status = PROCESS_STATUS.RUNNING;

		// check if there are any errors
		const errors = Object.fromEntries(
			processesList
				.filter((process) => process.error)
				.map((process) => [process.id, process.error!]),
		);
		this._error = Object.keys(errors).length > 0 ? errors : undefined;
		if (this._error) {
			// if there are errors, we have to be careful with the status
			// we only set the status to error if there are no running processes
			// otherwise, the status will be running
			if (!running) {
				this._status = PROCESS_STATUS.ERROR;
				return;
			}
		}

		// if there are no running processes
		// and there are processes, set the status to finished
		if (processesList.length > 0 && !running) {
			this._status = PROCESS_STATUS.FINISHED;
		}

		// notify all callbacks
		for (const key in this._callbacks) {
			this._callbacks[key](this._progress);
		}
	}
}

export const useShapeDiverStoreProcessManager =
	create<IShapeDiverStoreProcessManager>()(
		devtools(
			(set) => ({
				processManagers: {},
				addProcess: (
					processManagerId: string,
					process: IProcessDefinition,
				) => {
					set((state) => {
						const processManagers = {...state.processManagers};
						const processManager =
							processManagers[processManagerId];
						if (!processManager) {
							// if the process manager does not exist, throw an error
							throw new Error(
								`Process manager with id ${processManagerId} does not exist.`,
							);
						}

						processManager.addProcess(process);

						return {
							...state,
							processManagers: {
								...processManagers,
								[processManagerId]: processManager,
							},
						};
					});
				},
				createProcessManager: (controllerSessionId: string) => {
					const processManagerId = Math.random()
						.toString(36)
						.substring(7);

					set((state) => {
						const processManagers = {...state.processManagers};
						let processManager = processManagers[processManagerId];
						if (!processManager) {
							processManager = new ProcessManager(
								controllerSessionId,
								processManagerId,
							);
						}
						return {
							...state,
							processManagers: {
								...processManagers,
								[processManagerId]: processManager,
							},
						};
					});

					return processManagerId;
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | Process Manager"},
		),
	);

useShapeDiverStoreViewportAccessFunctions.subscribe(() => {
	const {processManagers} = useShapeDiverStoreProcessManager.getState();

	for (const processManagerId in processManagers) {
		const processManager = processManagers[processManagerId];
		// if the flags are already set, this function does nothing
		processManager.addFlags();
	}
});
