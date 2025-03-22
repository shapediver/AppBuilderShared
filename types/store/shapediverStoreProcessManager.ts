export enum PROCESS_STATUS {
	CREATED = "created",
	RUNNING = "running",
	FINISHED = "finished",
	ERROR = "error",
}

/**
 * Definition of a single process.
 *
 * @property {boolean} resolved - Flag indicating if the process has been resolved.
 * @property {Promise<unknown>} promise - The promise of the process.
 * @property {{percentage: number; msg?: string}} progress - The progress of the process.
 * @property {Error} error - The error of the process, if any.
 */
export interface IProcess {
	resolved: boolean;
	promise: Promise<unknown>;
	progress: {percentage: number; msg?: string};
	error?: Error;
}

/**
 * Definition of a process manager.
 * When the process manager is created,
 * it sets a {@link FLAG_TYPE.BUSY_MODE} and a {@link FLAG_TYPE.SUSPEND_SCENE_UPDATES} flag for all viewports.
 *
 * A process manager is responsible for managing a list of processes.
 * Once all processes have been resolved, the process manager removes the flags from the viewports
 * and removes itself from the store.
 *
 * @property {string} id - The id of the process manager.
 * @property {IProcess[]} processes - The list of processes.
 */
export interface IProcessManager {
	/**
	 * The id of the process manager.
	 * All processes managed by this process manager have the same id.
	 */
	id: string;
	/**
	 * The list of processes.
	 */
	processes: IProcess[];

	/**
	 * The progress of the process manager.
	 * The progress is calculated based on the progress of the processes.
	 */
	progress: {percentage: number; msg?: string[]};

	/**
	 * The error of the process manager.
	 * The error is set if any of the processes has an error.
	 */
	error?: Error[];

	/**
	 * The status of the process manager.
	 */
	status: PROCESS_STATUS;

	/**
	 * Adds a promise to the process manager.
	 * The promise is added as part of the list of processes.
	 *
	 * @param {Promise<unknown>} promise - The promise of the process.
	 * @param onProgress An optional callback function that returns the progress of the process.
	 */
	addPromise(
		promise: Promise<unknown>,
		onProgress?: (
			callback: (progress: {percentage: number; msg?: string}) => void,
		) => void,
	): void;
}

/**
 * Definition of the ShapeDiver store process manager.
 * The process manager is responsible for managing a list of process managers.
 */
export interface IShapeDiverStoreProcessManager {
	/**
	 * The list of process managers.
	 * The key is the id of the process manager.
	 */
	processManagers: {
		[processId: string]: IProcessManager;
	};

	/**
	 * Adds a promise to a process manager.
	 * If the process manager does not exist, it creates a new process manager.
	 *
	 * @param processId The id of the process manager.
	 * @param promise The promise of the process.
	 * @param onProgress An optional callback function that returns the progress of the process.
	 */
	addPromise: (
		processId: string,
		promise: Promise<unknown>,
		onProgress?: (
			callback: (progress: {percentage: number; msg?: string}) => void,
		) => void,
	) => void;

	/**
	 * Creates a new process manager.
	 * It is sometimes necessary to create a process manager without adding a promise.
	 * For example, if the processes are created asynchronously, but the flags need to be set immediately.
	 *
	 * @param processId The id of the process manager.
	 */
	createProcessManager: (processId: string) => void;
}
