import {FLAG_TYPE} from "@shapediver/viewer.session";

export enum PROCESS_STATUS {
	CREATED = "created",
	RUNNING = "running",
	FINISHED = "finished",
	ERROR = "error",
}

/**
 * Definition of the progress of a process.
 * The progress is a percentage value between 0 and 1.
 */
export interface IProgress {
	percentage: number;
	msg?: string;
}

/**
 * Definition of a process definition.
 * A process definition is a promise that can be added to the process manager.
 *
 * @property {string} id - The id of the process.
 * @property {string} name - The name of the process.
 * @property {Promise<unknown>} promise - The promise of the process.
 * @property {(callback: (progress: IProgress) => void) => void} onProgress - The callback function that is called when the progress of the process changes.
 */
export interface IProcessDefinition {
	id?: string;
	name?: string;
	promise: Promise<unknown>;
	onProgress?: (callback: (progress: IProgress) => void) => void;
}

/**
 * Definition of a single process.
 *
 * @property {string} id - The id of the process.
 * @property {string} name - The name of the process.
 * @property {boolean} resolved - Flag indicating if the process has been resolved.
 * @property {Promise<unknown>} promise - The promise of the process.
 * @property {IProgress[]} progress - The progress of the process. The last progress is the current progress of the process.
 * @property {Error} error - The error of the process, if any.
 */
export interface IProcess {
	id: string;
	name?: string;
	resolved: boolean;
	promise: Promise<unknown>;
	progress: IProgress[];
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
 */
export interface IProcessManager {
	/**
	 * The id of the controller session.
	 */
	controllerSessionId: string;
	/**
	 * The id of the process manager.
	 * All processes managed by this process manager have the same id.
	 */
	id: string;
	/**
	 * The dictionary of processes.
	 */
	processes: {
		[key: string]: IProcess;
	};

	/**
	 * The progress of the process manager.
	 * The progress is calculated based on the progress of the processes.
	 */
	progress: {
		[key: string]: IProgress[];
	};

	/**
	 * The error of the process manager.
	 * The error is set if any of the processes has an error.
	 */
	error?: {[key: string]: Error};

	/**
	 * The status of the process manager.
	 */
	status: PROCESS_STATUS;

	/**
	 * Add the busy mode and suspend scene updates flags to the viewport with the given id.
	 * The flags are removed once the process has been resolved.
	 *
	 * @param viewportId
	 * @param callback
	 * @returns
	 */
	addFlag: (
		viewportId: string,
		callback: (flag: FLAG_TYPE) => string,
	) => void;

	/**
	 * Adds a the busy mode and suspend scene updates flags to the viewports.
	 * The flags are added to all viewports.
	 * The flags are removed once all processes have been resolved.
	 *
	 * If the flags are already set, this function does nothing.
	 */
	addFlags: () => void;

	/**
	 * Adds a promise to the process manager.
	 * The promise is added as part of the list of processes.
	 *
	 * @param processDefinition The process to add to the process manager.
	 */
	addProcess(processDefinition: IProcessDefinition): void;

	/**
	 * Register a callback function that is called when the progress of the process manager changes.
	 * The callback function is called with the progress of the process manager.
	 *
	 * @returns A function that removes the callback function.
	 */
	notifyProgressChange: (
		callback: (progress: {[key: string]: IProgress[]}) => void,
	) => () => void;
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
		[processManagerId: string]: IProcessManager;
	};

	/**
	 * Adds a promise to a process manager.
	 * If the process manager does not exist, it creates a new process manager.
	 *
	 * @param processManagerId The id of the process manager.
	 * @param processDefinition The process to add to the process manager.
	 */
	addProcess: (
		processManagerId: string,
		processDefinition: IProcessDefinition,
	) => void;

	/**
	 * Creates a new process manager.
	 * It is sometimes necessary to create a process manager without adding a promise.
	 * For example, if the processes are created asynchronously, but the flags need to be set immediately.
	 *
	 * @param controllerSessionId The id of the controller session.
	 */
	createProcessManager: (controllerSessionId: string) => string;
}
