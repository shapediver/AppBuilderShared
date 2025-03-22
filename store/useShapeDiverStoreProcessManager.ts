import {
	IProcess,
	IProcessManager,
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
	readonly _processes: IProcess[] = [];
	readonly _busyModeFlagTokens: {
		[key: string]: string;
	} = {};
	readonly _suspendSceneUpdateFlagTokens: {
		[key: string]: string;
	} = {};

	_progress: {percentage: number; msg?: string[]} = {percentage: 0};
	_error?: Error[] = undefined;
	_status: PROCESS_STATUS = PROCESS_STATUS.CREATED;

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

	public get progress(): {percentage: number; msg?: string[]} {
		return this._progress;
	}

	public get error(): Error[] | undefined {
		return this._error;
	}

	public get status(): PROCESS_STATUS {
		return this._status;
	}

	public addPromise(
		promise: Promise<unknown>,
		onProgress?: (
			callback: (progress: {percentage: number; msg?: string}) => void,
		) => void,
	): void {
		const process: IProcess = {
			resolved: false,
			promise,
			progress: {
				percentage: 0,
			},
		};

		// if an onProgress callback is provided, listen to the progress of the promise
		if (onProgress) {
			onProgress((progress: {percentage: number; msg?: string}) => {
				process.progress = progress;
				this.evaluateProgress();
			});
		}

		// once the promise is resolved, set the resolved flag to true
		// and evaluate the processes
		process.promise.then(() => {
			process.resolved = true;
			this.evaluateProcesses();
		});

		// add a catch to the promise to handle errors
		process.promise.catch((error) => {
			process.error = error;
			process.resolved = true;
			this.evaluateProcesses();
		});

		this.processes.push(process);
		this.evaluateProcesses();
	}

	private addFlags(): void {
		const {viewportAccessFunctions} =
			useShapeDiverStoreViewportAccessFunctions.getState();
		// check if viewports already have the flags, if not, add them
		for (const viewportId in viewportAccessFunctions) {
			if (
				!this._busyModeFlagTokens[viewportId] &&
				viewportAccessFunctions[viewportId].addFlag
			) {
				this._busyModeFlagTokens[viewportId] = viewportAccessFunctions[
					viewportId
				].addFlag(FLAG_TYPE.BUSY_MODE);
			}
			if (
				!this._suspendSceneUpdateFlagTokens[viewportId] &&
				viewportAccessFunctions[viewportId].addFlag
			) {
				this._suspendSceneUpdateFlagTokens[viewportId] =
					viewportAccessFunctions[viewportId].addFlag(
						FLAG_TYPE.SUSPEND_SCENE_UPDATES,
					);
			}
		}
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
		if (this._status === PROCESS_STATUS.RUNNING) {
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
		this._progress = {
			percentage:
				this.processes
					.map((process) => process.progress.percentage)
					.reduce((acc, curr) => acc + curr, 0) /
				this.processes.length,
			msg: this.processes
				.map((process) => process.progress.msg)
				.filter((msg) => msg !== undefined) as string[],
		};

		// check if there are still running processes
		const running =
			this.processes.length > 0 &&
			this.processes.some((process) => !process.resolved);

		// check if there are any errors
		const errors = this.processes
			.filter((process) => process.error)
			.map((process) => process.error)
			.filter((error) => error !== undefined);
		this._error = errors.length > 0 ? errors : undefined;
		if (this._error) {
			// if there are errors, we have to be careful with the status
			// we only set the status to error if there are no running processes
			// otherwise, the status will be running
			if (!running) {
				this._status = PROCESS_STATUS.ERROR;
				return;
			}
		}
		this._status = running
			? PROCESS_STATUS.RUNNING
			: PROCESS_STATUS.FINISHED;
		this._progress = running ? this._progress : {percentage: 1};
	}
}

export const useShapeDiverStoreProcessManager =
	create<IShapeDiverStoreProcessManager>()(
		devtools(
			(set) => ({
				processManagers: {},
				addPromise: (
					processId: string,
					promise: Promise<unknown>,
					onProgress?: (
						callback: (progress: {
							percentage: number;
							msg?: string;
						}) => void,
					) => void,
				) => {
					set((state) => {
						const processManagers = {...state.processManagers};
						const processManager =
							processManagers[processId] ??
							new ProcessManager(processId);

						processManager.addPromise(promise, onProgress);

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
