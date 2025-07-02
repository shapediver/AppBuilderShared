import {devtoolsSettings} from "@AppBuilderShared/store/storeSettings";
import {
	EventActionEnum,
	IEventTracking,
} from "@AppBuilderShared/types/eventTracking";
import {
	IShapeDiverExport,
	IShapeDiverExportDefinition,
} from "@AppBuilderShared/types/shapediver/export";
import {
	IShapeDiverOutput,
	IShapeDiverOutputDefinition,
} from "@AppBuilderShared/types/shapediver/output";
import {
	IShapeDiverParameter,
	IShapeDiverParameterDefinition,
	IShapeDiverParameterExecutor,
	IShapeDiverParameterState,
} from "@AppBuilderShared/types/shapediver/parameter";
import {
	IAcceptRejectModeSelector,
	IExportResponse,
	IExportStore,
	IExportStores,
	IExportStoresPerSession,
	IGenericParameterDefinition,
	IGenericParameterExecutor,
	IHistoryEntry,
	IOutputStore,
	IOutputStores,
	IParameterChanges,
	IParameterChangesPerSession,
	IParameterStore,
	IParameterStores,
	IParameterStoresPerSession,
	IPreExecutionHook,
	ISessionDependency,
	ISessionsHistoryState,
	IShapeDiverStoreParameters,
} from "@AppBuilderShared/types/store/shapediverStoreParameters";
import {IProcessDefinition} from "@AppBuilderShared/types/store/shapediverStoreProcessManager";
import {addValidator} from "@AppBuilderShared/utils/parameters/parameterValidation";
import {
	ShapeDiverRequestCustomization,
	ShapeDiverRequestExport,
} from "@shapediver/api.geometry-api-dto-v2";
import {
	addListener,
	EVENTTYPE,
	IEvent,
	IExportApi,
	IOutputApi,
	IParameterApi,
	ISessionApi,
	isFileParameterApi,
	ITaskEvent,
	removeListener,
	TASK_TYPE,
} from "@shapediver/viewer.session";
import {produce} from "immer";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import {useShapeDiverStoreProcessManager} from "./useShapeDiverStoreProcessManager";

/**
 * Create an IShapeDiverParameterExecutor for a single parameter,
 * for use with createParameterStore.
 *
 * @param namespace The session namespace of the parameter.
 * @param param The parameter definition.
 * @param getChanges Function for getting the change object of the parameter's session.
 * @returns
 */
function createParameterExecutor<T>(
	namespace: string,
	param: IGenericParameterDefinition,
	getChanges: () => IParameterChanges,
): IShapeDiverParameterExecutor<T> {
	const paramId = param.definition.id;

	return {
		execute: async (
			uiValue: T | string,
			execValue: T | string,
			forceImmediate?: boolean,
			skipHistory?: boolean,
		) => {
			const changes = getChanges();

			// check whether there is anything to do
			const result = changes.removeValueChange(paramId);
			if (result.removed && uiValue === execValue) {
				console.debug(`Removing change of parameter ${paramId}`);
				// check if there are any other parameter updates queued
				if (result.isEmpty) {
					console.debug(
						`Rejecting changes for namespace ${namespace}`,
					);
					changes.reject();
				}

				return execValue;
			}

			// execute the change
			try {
				console.debug(
					`Queueing change of parameter ${paramId} to ${uiValue}`,
				);
				changes.addValueChange(paramId, uiValue);
				const values = forceImmediate
					? await changes.accept(skipHistory, [paramId])
					: await changes.wait;
				const value = paramId in values ? values[paramId] : uiValue;
				if (value !== uiValue)
					console.debug(
						`Executed change of parameter ${paramId} to ${value} instead of ${uiValue} (overridden by pre-execution hook)`,
					);
				else
					console.debug(
						`Executed change of parameter ${paramId} to ${uiValue}`,
					);

				return value;
			} catch (e) {
				console.debug(
					`Rejecting change of parameter ${paramId} to ${uiValue}, resetting to "${execValue}"`,
					e ?? "",
				);

				return execValue;
			}
		},
		isValid: (uiValue: T | string, throwError?: boolean) =>
			param.isValid ? param.isValid(uiValue, throwError) : true,
		stringify: (value: T | string) =>
			param.stringify ? param.stringify(value) : value + "",
		definition: param.definition,
	};
}

type DefaultExportsGetter = () => string[];
type ExportResponseSetter = (response: IExportResponse) => void;
type HistoryPusher = (entry: ISessionsHistoryState) => void;

/**
 * Register a session in the process manager.
 * This function creates a process manager for the session and registers the progress callback.
 *
 * The corresponding task events are registered and unregistered automatically.
 * Within the task events, the progress callback is called with the progress of the task.
 *
 * @param session
 * @returns
 */
const registerInProcessManager = (session: ISessionApi) => {
	const {createProcessManager, addProcess} =
		useShapeDiverStoreProcessManager.getState();
	// create a process manager for the session
	const processManagerId = createProcessManager(session.id);

	let resolveMainPromise: () => void;
	const mainPromise = new Promise<void>((resolve) => {
		resolveMainPromise = resolve;
	});

	// create a callback function for the progress
	let progressCallback: (progress: {
		percentage: number;
		msg?: string;
	}) => void;

	// create a function to register the progress callback
	const onProgressCallback = (
		callback: (progress: {percentage: number; msg?: string}) => void,
	) => {
		progressCallback = callback;
	};
	const mainProcessDefinition: IProcessDefinition = {
		name: "Session Process",
		promise: mainPromise,
		onProgress: onProgressCallback,
	};

	// add process to the process manager
	addProcess(processManagerId, mainProcessDefinition);

	// create a callback function for the progress
	const customizationProcessCallback = (e: IEvent) => {
		const taskEvent = e as ITaskEvent;
		const taskData = taskEvent.data as {
			sessionId: string;
		};
		if (
			taskEvent.type === TASK_TYPE.SESSION_CUSTOMIZATION &&
			taskData.sessionId === session.id
		) {
			progressCallback({
				percentage: taskEvent.progress,
				msg: taskEvent.status,
			});
		}
	};

	// create a callback function for the progress
	// and remove the listeners when the task is cancelled or finished
	const customizationProcessCallbackEnd = (e: IEvent) => {
		const taskEvent = e as ITaskEvent;
		const taskData = taskEvent.data as {
			sessionId: string;
		};
		if (
			taskEvent.type === TASK_TYPE.SESSION_CUSTOMIZATION &&
			taskData.sessionId === session.id
		) {
			progressCallback({
				percentage: taskEvent.progress,
				msg: taskEvent.status,
			});

			// remove listeners
			removeListener(tokenStart);
			removeListener(tokenProcess);
			removeListener(tokenEnd);
			removeListener(tokenCancel);
		}
	};

	const tokenStart = addListener(
		EVENTTYPE.TASK.TASK_START,
		customizationProcessCallback,
	);
	const tokenProcess = addListener(
		EVENTTYPE.TASK.TASK_PROCESS,
		customizationProcessCallback,
	);
	const tokenEnd = addListener(
		EVENTTYPE.TASK.TASK_END,
		customizationProcessCallbackEnd,
	);
	const tokenCancel = addListener(
		EVENTTYPE.TASK.TASK_CANCEL,
		customizationProcessCallbackEnd,
	);

	return resolveMainPromise!;
};

/**
 * Create an IGenericParameterExecutor  for a session.
 * @param session
 * @param getDefaultExports
 * @param exportResponseSetter
 * @returns
 */
function createGenericParameterExecutorForSession(
	session: ISessionApi,
	getDefaultExports: DefaultExportsGetter,
	exportResponseSetter: ExportResponseSetter,
	historyPusher: HistoryPusher,
	callbacks?: IEventTracking,
): IGenericParameterExecutor {
	/**
	 * Note: This function receives key-value pairs of parameter value changes
	 * that should be executed.
	 * Typically this does not include all parameters defined by the session.
	 */
	return async (values, namespace, skipHistory) => {
		// store previous values (we restore them in case of error)
		const previousValues = Object.keys(values).reduce(
			(acc, paramId) => {
				acc[paramId] = session.parameters[paramId].value;

				return acc;
			},
			{} as {[paramId: string]: unknown},
		);

		// get ids of default exports that should be requested
		const exports = getDefaultExports();

		// start timer
		const start = performance.now();
		let action: EventActionEnum = EventActionEnum.CUSTOMIZE;

		try {
			// set values and call customize
			Object.keys(values).forEach(
				(id) => (session.parameters[id].value = values[id]),
			);

			// create a process manager for the session customization
			const resolve = registerInProcessManager(session);

			if (exports.length > 0) {
				// upload any file parameters (session.requestExports would upload them but not store the ids)
				const fileParameters = Object.values(session.parameters).filter(
					(param) => isFileParameterApi(param),
				);
				for (const fileParameter of fileParameters) {
					const fileId = await fileParameter.upload();
					fileParameter.value = fileId;
				}
				// prepare body and send request
				action = EventActionEnum.EXPORT;
				const body: ShapeDiverRequestExport = {
					parameters:
						session.parameterValues as ShapeDiverRequestCustomization, // TODO fix this
					exports,
					outputs: Object.keys(session.outputs),
				};
				const response = await session.requestExports(body, true);
				exportResponseSetter(response.exports as IExportResponse);
			} else {
				await session.customize();
			}

			// resolve the promise of the process manager
			resolve();

			if (!skipHistory) {
				const state: ISessionsHistoryState = {
					[session.id]: session.parameterValues,
				};
				historyPusher(state);
			}

			// report success
			callbacks?.onSuccess({
				namespace,
				duration: Math.round(performance.now() - start),
				action,
			});
		} catch (e: any) {
			// in case of an error, restore the previous values
			Object.keys(previousValues).forEach(
				(id) => (session.parameters[id].value = previousValues[id]),
			);
			// report the exception
			callbacks?.onError(e, {
				namespace,
				duration: Math.round(performance.now() - start),
				action,
			});
			// rethrow the error
			throw e;
		}
	};
}

/**
 * Create store for a single parameter.
 */
function createParameterStore<T>(
	executor: IShapeDiverParameterExecutor<T>,
	acceptRejectMode: boolean,
	defaultValue?: T | string,
) {
	const definition = executor.definition;

	/** The static definition of a parameter. */
	const defval =
		defaultValue !== undefined ? defaultValue : definition.defval;
	const state: IShapeDiverParameterState<T> = {
		uiValue: defval,
		execValue: defval,
		dirty: false,
	};

	return create<IShapeDiverParameter<T>>()(
		devtools(
			(set, get) => ({
				definition,
				acceptRejectMode,
				/**
				 * The dynamic properties (aka the "state") of a parameter.
				 * Reactive components can react to this state, but not update it.
				 */
				state,
				/** Actions that can be taken on the parameter. */
				actions: {
					setUiValue: function (uiValue: string | T): boolean {
						const actions = get().actions;
						if (!actions.isValid(uiValue, false)) return false;
						set(
							(_state) => ({
								state: {
									..._state.state,
									uiValue,
									dirty: uiValue !== _state.state.execValue,
								},
							}),
							false,
							"setUiValue",
						);

						return true;
					},
					setUiAndExecValue: function (value: string | T): boolean {
						const actions = get().actions;
						if (!actions.isValid(value, false)) return false;
						set(
							() => ({
								state: {
									uiValue: value,
									execValue: value,
									dirty: false,
								},
							}),
							false,
							"setUiAndExecValue",
						);

						return true;
					},
					execute: async function (
						forceImmediate?: boolean,
						skipHistory?: boolean,
					): Promise<T | string> {
						const state = get().state;
						const result = await executor.execute(
							state.uiValue,
							state.execValue,
							forceImmediate,
							skipHistory,
						);
						// TODO in case result is not the current uiValue, we could somehow visualize
						// the fact that the uiValue gets reset here
						set(
							(_state) => ({
								state: {
									..._state.state,
									uiValue: result,
									execValue: result,
									dirty: false,
								},
							}),
							false,
							"execute",
						);

						return result;
					},
					isValid: function (
						value: any,
						throwError?: boolean | undefined,
					): boolean {
						return executor.isValid(value, throwError);
					},
					isUiValueDifferent: function (value: any): boolean {
						const {
							state: {uiValue},
						} = get();

						return (
							executor.stringify(value) !==
							executor.stringify(uiValue)
						);
					},
					resetToDefaultValue: function (): void {
						const definition = get().definition;
						set(
							(_state) => ({
								state: {
									..._state.state,
									uiValue: definition.defval,
									dirty:
										definition.defval !==
										_state.state.execValue,
								},
							}),
							false,
							"resetToDefaultValue",
						);
					},
					resetToExecValue: function (): void {
						const state = get().state;
						set(
							(_state) => ({
								state: {
									..._state.state,
									uiValue: state.execValue,
									dirty: false,
								},
							}),
							false,
							"resetToExecValue",
						);
					},
				},
			}),
			{
				...devtoolsSettings,
				name: `ShapeDiver | Parameter | ${definition.id}`,
			},
		),
	);
}

/**
 * Map definition of parameter from API to store.
 * @param parameterApi
 * @returns
 */
function mapParameterDefinition<T>(
	parameterApi: IParameterApi<T>,
): IShapeDiverParameterDefinition {
	return {
		id: parameterApi.id,
		choices: parameterApi.choices,
		decimalplaces: parameterApi.decimalplaces,
		defval: parameterApi.defval,
		expression: parameterApi.expression,
		format: parameterApi.format,
		min: parameterApi.min,
		max: parameterApi.max,
		umin: parameterApi.umin,
		umax: parameterApi.umax,
		vmin: parameterApi.vmin,
		vmax: parameterApi.vmax,
		interval: parameterApi.interval,
		name: parameterApi.name,
		type: parameterApi.type,
		visualization: parameterApi.visualization,
		structure: parameterApi.structure,
		group: parameterApi.group,
		hint: parameterApi.hint,
		order: parameterApi.order,
		tooltip: parameterApi.tooltip,
		displayname: parameterApi.displayname,
		hidden: parameterApi.hidden,
		settings: parameterApi.settings,
	};
}

/**
 * Map definition of export from API to store.
 * @param exportApi
 * @returns
 */
function mapExportDefinition(
	exportApi: IExportApi,
): IShapeDiverExportDefinition {
	return {
		id: exportApi.id,
		uid: exportApi.uid,
		name: exportApi.name,
		type: exportApi.type,
		dependency: exportApi.dependency,
		group: exportApi.group,
		order: exportApi.order,
		tooltip: exportApi.tooltip,
		displayname: exportApi.displayname,
		hidden: exportApi.hidden,
	};
}

/**
 * Map definition of output from API to store.
 * @param outputApi
 * @returns
 */
function mapOutputDefinition(
	outputApi: IOutputApi,
): IShapeDiverOutputDefinition {
	return {
		id: outputApi.id,
		uid: outputApi.uid,
		name: outputApi.name,
		dependency: outputApi.dependency,
		group: outputApi.group,
		order: outputApi.order,
		tooltip: outputApi.tooltip,
		displayname: outputApi.displayname,
		hidden: outputApi.hidden,
		chunks: outputApi.chunks,
	};
}

/**
 * Create export store for the given session and export id.
 * @param session
 * @param exportId
 * @param token
 * @returns
 */
function createExportStore(session: ISessionApi, exportId: string) {
	const exportApi = session.exports[exportId];
	/** The static definition of the export. */
	const definition = mapExportDefinition(exportApi);
	const sessionExport = exportApi;
	/** We need to access latest parameter values */
	const parameterApis = Object.values(session.parameters);

	return create<IShapeDiverExport>(() => ({
		definition,
		/** Actions that can be taken on the export. */
		actions: {
			request: async (parameters?: {[key: string]: string}) => {
				const parametersComplete = parameters ?? {};
				for (const p of parameterApis) {
					if (!(p.id in parametersComplete)) {
						if (isFileParameterApi(p)) {
							parametersComplete[p.id] = await p.upload();
							p.value = parametersComplete[p.id];
						} else parametersComplete[p.id] = p.stringify();
					}
				}

				return sessionExport.request(parametersComplete);
			},
			fetch: async (url: string) => {
				return fetch(url, {
					...(session.jwtToken
						? {headers: {Authorization: session.jwtToken}}
						: {}),
				});
			},
		},
	}));
}

/**
 * Create output store for the given session and output id.
 * @param session
 * @param outputId
 * @returns
 */
function createOutputStore(session: ISessionApi, outputId: string) {
	const outputApi = session.outputs[outputId];
	if (!outputApi)
		throw new Error(
			`Output ${outputId} does not exist for session ${session.id}`,
		);

	const definition = mapOutputDefinition(outputApi);

	return create<IShapeDiverOutput>()(
		devtools(
			() => ({
				definition,
			}),
			devtoolsSettings,
		),
	);
}

/**
 * Check if the given parameter definition matches the given parameter store
 */
function isMatchingParameterDefinition(
	store: IParameterStore,
	definition: IGenericParameterDefinition,
) {
	const a = store.getState().definition;
	const b = definition.definition;

	// deep comparison between a and b
	// NOTE: this is a quick and dirty solution, ideally we would compare the definitions in a more robust way
	return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Check if the given parameter value matches the executed value in the parameter store
 */
function isMatchingExecutedParameterValue(
	store: IParameterStore,
	definition: IGenericParameterDefinition,
) {
	const {execValue} = store.getState().state;
	const value = definition.value;

	return value === undefined || execValue === value;
}

/**
 * Store data related to abstracted parameters and exports.
 * @see {@link IShapeDiverStoreParameters}
 */
export const useShapeDiverStoreParameters =
	create<IShapeDiverStoreParameters>()(
		devtools(
			(set, get) => ({
				parameterStores: {},
				exportStores: {},
				outputStores: {},
				sessionDependency: {},
				parameterChanges: {},
				defaultExports: {},
				defaultExportResponses: {},
				preExecutionHooks: {},
				history: [],
				historyIndex: -1,

				removeChanges: (namespace: string) => {
					const {parameterChanges} = get();

					// check if there is something to remove
					if (!parameterChanges[namespace]) return;

					// create a new object, omitting the session to be removed
					const changes: IParameterChangesPerSession = {};
					Object.keys(parameterChanges).forEach((id) => {
						if (id !== namespace)
							changes[id] = parameterChanges[id];
					});

					set(
						() => ({
							parameterChanges: changes,
						}),
						false,
						"removeChanges",
					);
				},

				getChanges: (
					namespace: string,
					executor: IGenericParameterExecutor,
					priority: number,
					preExecutionHook?: IPreExecutionHook,
				): IParameterChanges => {
					const {parameterChanges, removeChanges} = get();
					if (parameterChanges[namespace])
						return parameterChanges[namespace];

					const changes: IParameterChanges = {
						values: {},
						accept: () => Promise.resolve({}),
						reject: () => undefined,
						wait: Promise.resolve({}),
						executing: false,
						priority,
						addValueChange(id: string, value: any) {
							const {parameterChanges} = get();
							if (parameterChanges[namespace]) {
								set(
									produce((state) => {
										state.parameterChanges[
											namespace
										].values[id] = value;
									}),
									false,
									"addValueChange",
								);
							}
						},
						removeValueChange(id: string) {
							const {parameterChanges} = get();

							if (!(namespace in parameterChanges))
								return {isEmpty: true, removed: false};

							if (id in parameterChanges[namespace].values) {
								const isEmpty =
									Object.keys(
										parameterChanges[namespace].values,
									).length === 1;
								set(
									produce((state) => {
										delete state.parameterChanges[namespace]
											.values[id];
									}),
									false,
									"removeValueChange",
								);
								return {isEmpty, removed: true};
							}

							return {
								isEmpty:
									Object.keys(
										parameterChanges[namespace].values,
									).length === 0,
								removed: false,
							};
						},
					};

					changes.wait = new Promise((resolve, reject) => {
						changes.accept = async (skipHistory, parameterIds) => {
							// get currently queued parameter value changes
							const {parameterChanges} = get();
							if (!(namespace in parameterChanges))
								return Promise.resolve({});
							const values = parameterChanges[namespace].values;
							let allChangesAccepted = true;
							try {
								// filter changed values by optional parameterIds
								const changedValues = parameterIds
									? Object.keys(values)
											.filter((id) =>
												parameterIds.includes(id),
											)
											.reduce(
												(acc, id) => {
													acc[id] = values[id];

													return acc;
												},
												{} as {[key: string]: any},
											)
									: values;
								// check if there are changes left
								allChangesAccepted =
									Object.keys(values).length ===
									Object.keys(changedValues).length;
								// remove changes from changed values which are part of changedValues
								set(
									produce((state) => {
										Object.keys(changedValues).forEach(
											(id) => {
												if (
													id in
													state.parameterChanges[
														namespace
													].values
												)
													delete state
														.parameterChanges[
														namespace
													].values[id];
											},
										);
									}),
									false,
									"accept - remove value changes",
								);
								// use the optional pre-execution hook to amend the values (used for custom parameters)
								const amendedValues = preExecutionHook
									? await preExecutionHook(
											changedValues,
											namespace,
										)
									: changedValues;
								// get executor promise, but don't wait for it yet
								const promise = executor(
									amendedValues,
									namespace,
									skipHistory,
								);
								// set "executing" mode
								set(
									produce((state) => {
										state.parameterChanges[
											namespace
										].executing = true;
									}),
									false,
									"executeChanges - start",
								);
								// wait for execution
								await promise;
								// if there are no changes left, resolve and remove the changes
								if (allChangesAccepted) {
									resolve(amendedValues);
								} else {
									// else disable the executing mode
									set(
										produce((state) => {
											state.parameterChanges[
												namespace
											].executing = false;
										}),
										false,
										"executeChanges - end",
									);
								}
								return amendedValues;
							} catch (e: any) {
								reject(e);
							} finally {
								if (allChangesAccepted)
									removeChanges(namespace);
							}
							return {};
						};
						changes.reject = () => {
							removeChanges(namespace);
							reject();
						};

						set(
							(_state) => ({
								parameterChanges: {
									..._state.parameterChanges,
									...{[namespace]: changes},
								},
							}),
							false,
							"getChanges",
						);
					});

					return changes;
				},

				addSession: (
					session: ISessionApi,
					_acceptRejectMode: boolean | IAcceptRejectModeSelector,
					callbacks?: IEventTracking,
				) => {
					const sessionId = session.id;
					const {
						parameterStores: parameters,
						exportStores: exports,
						outputStores: outputs,
						getChanges,
						pushHistoryState,
					} = get();

					// check if there is something to add
					if (parameters[sessionId] || exports[sessionId]) return;

					const getDefaultExports = () => {
						return get().defaultExports[sessionId] || [];
					};
					const setExportResponse = (response: IExportResponse) => {
						set(
							(_state) => ({
								defaultExportResponses: {
									..._state.defaultExportResponses,
									...{[sessionId]: response},
								},
							}),
							false,
							"setExportResponse",
						);
					};
					const historyPusher = (state: ISessionsHistoryState) => {
						const entry = pushHistoryState(state);
						history.pushState(entry, "");
					};
					const executor = createGenericParameterExecutorForSession(
						session,
						getDefaultExports,
						setExportResponse,
						historyPusher,
						callbacks,
					);

					const acceptRejectModeSelector =
						typeof _acceptRejectMode === "boolean"
							? () => _acceptRejectMode
							: _acceptRejectMode;

					set(
						(_state) => ({
							parameterStores: {
								..._state.parameterStores,
								...(parameters[sessionId]
									? {} // Keep existing parameter stores
									: {
											[sessionId]: Object.keys(
												session.parameters,
											).reduce((acc, paramId) => {
												const param =
													session.parameters[paramId];
												const acceptRejectMode =
													acceptRejectModeSelector(
														param,
													);
												acc[paramId] =
													createParameterStore(
														createParameterExecutor(
															sessionId,
															{
																definition:
																	mapParameterDefinition(
																		param,
																	),
																isValid: (
																	value,
																	throwError,
																) =>
																	param.isValid(
																		value,
																		throwError,
																	),
																stringify: (
																	value,
																) =>
																	param.stringify(
																		value,
																	),
															},
															() => {
																const {
																	preExecutionHooks,
																} = get();

																return getChanges(
																	sessionId,
																	executor,
																	0,
																	preExecutionHooks[
																		sessionId
																	],
																);
															},
														),
														acceptRejectMode,
														param.value,
													);

												return acc;
											}, {} as IParameterStores),
										}), // Create new parameter stores
							},
							exportStores: {
								..._state.exportStores,
								...(exports[sessionId]
									? {} // Keep existing export stores
									: {
											[sessionId]: Object.keys(
												session.exports,
											).reduce((acc, exportId) => {
												acc[exportId] =
													createExportStore(
														session,
														exportId,
													);

												return acc;
											}, {} as IExportStores),
										}), // Create new export stores
							},
							outputStores: {
								..._state.outputStores,
								...(outputs[sessionId]
									? {} // Keep existing output stores
									: {
											[sessionId]: Object.keys(
												session.outputs,
											).reduce((acc, outputId) => {
												acc[outputId] =
													createOutputStore(
														session,
														outputId,
													);

												return acc;
											}, {} as IOutputStores),
										}), // Create new output stores
							},
							sessionDependency: {
								..._state.sessionDependency,
								...{[sessionId]: [sessionId]},
							},
						}),
						false,
						"addSession",
					);
				},

				addGeneric: (
					namespace: string,
					_acceptRejectMode: boolean | IAcceptRejectModeSelector,
					definitions:
						| IGenericParameterDefinition
						| IGenericParameterDefinition[],
					executor: IGenericParameterExecutor,
					dependsOnSessions: string[] | string | undefined,
				) => {
					const {parameterStores: parameters, getChanges} = get();

					// check if there is something to add
					if (parameters[namespace]) return;

					const acceptRejectModeSelector =
						typeof _acceptRejectMode === "boolean"
							? () => _acceptRejectMode
							: _acceptRejectMode;

					set(
						(_state) => ({
							parameterStores: {
								..._state.parameterStores,
								...(parameters[namespace]
									? {} // Keep existing parameter stores
									: {
											[namespace]: (Array.isArray(
												definitions,
											)
												? definitions
												: [definitions]
											).reduce((acc, def) => {
												def = addValidator(def);
												const paramId =
													def.definition.id;
												const acceptRejectMode =
													acceptRejectModeSelector(
														def.definition,
													);
												acc[paramId] =
													createParameterStore(
														createParameterExecutor(
															namespace,
															def,
															() =>
																getChanges(
																	namespace,
																	executor,
																	-1,
																),
														),
														acceptRejectMode,
													);

												return acc;
											}, {} as IParameterStores),
										}), // Create new parameter stores
							},
							sessionDependency: {
								..._state.sessionDependency,
								...{
									[namespace]: Array.isArray(
										dependsOnSessions,
									)
										? dependsOnSessions
										: dependsOnSessions
											? [dependsOnSessions]
											: [],
								},
							},
						}),
						false,
						"addGeneric",
					);
				},

				syncGeneric: (
					namespace: string,
					_acceptRejectMode: boolean | IAcceptRejectModeSelector,
					definitions:
						| IGenericParameterDefinition
						| IGenericParameterDefinition[],
					executor: IGenericParameterExecutor,
					dependsOnSessions: string[] | string | undefined,
				) => {
					const {
						parameterStores: parameterStorePerSession,
						getChanges,
					} = get();
					definitions = Array.isArray(definitions)
						? definitions
						: [definitions];

					const acceptRejectModeSelector =
						typeof _acceptRejectMode === "boolean"
							? () => _acceptRejectMode
							: _acceptRejectMode;

					const existingParameterStores =
						parameterStorePerSession[namespace] ?? {};
					let hasChanges = false;
					const parameterStores: IParameterStores = {};

					definitions.forEach((def) => {
						def = addValidator(def);
						const paramId = def.definition.id;
						let setUiAndExecValue = false;
						// check if a matching parameter store already exists
						if (
							paramId in existingParameterStores &&
							isMatchingParameterDefinition(
								existingParameterStores[paramId],
								def,
							)
						) {
							parameterStores[paramId] =
								existingParameterStores[paramId];
							setUiAndExecValue =
								!isMatchingExecutedParameterValue(
									existingParameterStores[paramId],
									def,
								);
						} else {
							const acceptRejectMode = acceptRejectModeSelector(
								def.definition,
							);
							parameterStores[paramId] = createParameterStore(
								createParameterExecutor(namespace, def, () =>
									getChanges(namespace, executor, -1),
								),
								acceptRejectMode,
							);
							hasChanges = true;
							setUiAndExecValue = def.value !== undefined;
						}

						if (setUiAndExecValue) {
							const {actions} =
								parameterStores[paramId].getState();
							if (!actions.setUiAndExecValue(def.value)) {
								console.warn(
									`Could not update value of generic parameter ${paramId} to ${def.value}`,
								);
							} else {
								console.debug(
									`Updated value of generic parameter ${paramId} to ${def.value}`,
								);
							}
						}
					});

					if (
						!hasChanges &&
						Object.keys(existingParameterStores).length ===
							Object.keys(parameterStores).length
					)
						return;

					set(
						(_state) => ({
							parameterStores: {
								..._state.parameterStores,
								...{[namespace]: parameterStores},
							},
							sessionDependency: {
								..._state.sessionDependency,
								...{
									[namespace]: Array.isArray(
										dependsOnSessions,
									)
										? dependsOnSessions
										: dependsOnSessions
											? [dependsOnSessions]
											: [],
								},
							},
						}),
						false,
						"syncGeneric",
					);
				},

				removeSession: (namespace: string) => {
					const {
						parameterStores: parametersPerSession,
						exportStores: exportsPerSession,
						sessionDependency,
					} = get();

					// check if there is something to remove
					if (
						!parametersPerSession[namespace] &&
						!exportsPerSession[namespace]
					)
						return;

					// create a new object, omitting the session to be removed
					const parameters: IParameterStoresPerSession = {};
					Object.keys(parametersPerSession).forEach((id) => {
						if (id !== namespace)
							parameters[id] = parametersPerSession[id];
					});

					// create a new object, omitting the session to be removed
					const exports: IExportStoresPerSession = {};
					Object.keys(exportsPerSession).forEach((id) => {
						if (id !== namespace)
							exports[id] = exportsPerSession[id];
					});

					// create a new object, omitting the session to be removed
					const dependency: ISessionDependency = {};
					Object.keys(sessionDependency).forEach((id) => {
						if (id !== namespace)
							dependency[id] = sessionDependency[id];
					});

					set(
						() => ({
							parameterStores: parameters,
							exportStores: exports,
							sessionDependency: dependency,
						}),
						false,
						"removeSession",
					);
				},

				getParameters: (namespace: string) => {
					return get().parameterStores[namespace] || {};
				},

				getParameter: (
					namespace: string,
					paramId: string,
					type?: string,
				) => {
					return Object.values(get().getParameters(namespace)).find(
						(p) => {
							const def = p.getState().definition;

							return (
								(!type || type === def.type) &&
								(def.id === paramId ||
									def.name === paramId ||
									def.displayname === paramId)
							);
						},
					) as IParameterStore;
				},

				getExports: (namespace: string) => {
					return get().exportStores[namespace] || {};
				},

				getExport: (namespace: string, exportId: string) => {
					return Object.values(get().getExports(namespace)).find(
						(p) => {
							const def = p.getState().definition;

							return (
								def.id === exportId ||
								def.name === exportId ||
								def.displayname === exportId
							);
						},
					) as IExportStore;
				},

				getOutputs: (namespace: string) => {
					return get().outputStores[namespace] || {};
				},

				getOutput: (namespace: string, outputId: string) => {
					return Object.values(get().getOutputs(namespace)).find(
						(p) => {
							const def = p.getState().definition;

							return (
								def.id === outputId ||
								def.name === outputId ||
								def.displayname === outputId
							);
						},
					) as IOutputStore;
				},

				registerDefaultExport: (
					namespace: string,
					exportId: string | string[],
				) => {
					const exportIds = Array.isArray(exportId)
						? exportId
						: [exportId];
					if (exportIds.length === 0) return;
					const {defaultExports} = get();
					const existing = defaultExports[namespace];
					const filtered = existing
						? exportIds.filter((id) => existing.indexOf(id) < 0)
						: exportIds;
					const newExports = existing
						? existing.concat(filtered)
						: exportIds;

					set(
						(_state) => ({
							defaultExports: {
								..._state.defaultExports,
								...{[namespace]: newExports},
							},
						}),
						false,
						"registerDefaultExport",
					);
				},

				deregisterDefaultExport: (
					namespace: string,
					exportId: string | string[],
				) => {
					const {defaultExports, defaultExportResponses} = get();

					const exportIds = Array.isArray(exportId)
						? exportId
						: [exportId];
					if (exportIds.length === 0) return;

					const existingDefaultExports = defaultExports[namespace];
					if (!existingDefaultExports) return;

					const newDefaultExports = existingDefaultExports.filter(
						(id) => exportIds.indexOf(id) < 0,
					);
					if (
						newDefaultExports.length ===
						existingDefaultExports.length
					)
						return;

					const existingDefaultExportResponses =
						defaultExportResponses[namespace] ?? {};
					const newDefaultExportResponses: IExportResponse = {};
					Object.keys(existingDefaultExportResponses).forEach(
						(id) => {
							if (exportIds.indexOf(id) < 0)
								newDefaultExportResponses[id] =
									existingDefaultExportResponses[id];
						},
					);

					set(
						(_state) => ({
							defaultExports: {
								..._state.defaultExports,
								...{[namespace]: newDefaultExports},
							},
							defaultExportResponses: {
								..._state.defaultExportResponses,
								...{[namespace]: newDefaultExportResponses},
							},
						}),
						false,
						"deregisterDefaultExport",
					);
				},

				setPreExecutionHook: (
					namespace: string,
					hook: IPreExecutionHook,
				) => {
					if (!namespace) return;

					const {preExecutionHooks} = get();
					if (namespace in preExecutionHooks)
						console.warn(
							`Pre-execution hook for session namespace ${namespace} already exists, overwriting it.`,
						);

					set(
						(_state) => ({
							preExecutionHooks: {
								..._state.preExecutionHooks,
								...{[namespace]: hook},
							},
						}),
						false,
						"setPreExecutionHook",
					);
				},

				removePreExecutionHook: (namespace: string) => {
					if (!namespace) return;

					const {preExecutionHooks} = get();
					if (!preExecutionHooks[namespace]) return;

					const hooks: {[key: string]: IPreExecutionHook} = {};
					Object.keys(preExecutionHooks).forEach((id) => {
						if (id !== namespace) hooks[id] = preExecutionHooks[id];
					});

					set(
						() => ({
							preExecutionHooks: hooks,
						}),
						false,
						"removePreExecutionHook",
					);
				},

				async batchParameterValueUpdate(
					namespace: string,
					values: {[key: string]: string},
					skipHistory?: boolean,
				) {
					const {parameterStores} = get();
					const stores = parameterStores[namespace];
					if (!stores) return;

					const paramIds = Object.keys(values);
					if (paramIds.length === 0) return;

					// verify that all parameter stores exist and values are valid
					paramIds.forEach((paramId) => {
						const store = stores[paramId];
						if (!store)
							throw new Error(
								`Parameter ${paramId} does not exist for session namespace ${namespace}`,
							);

						const {actions} = store.getState();
						const value = values[paramId];
						if (!actions.isValid(value))
							throw new Error(
								`Value ${value} is not valid for parameter ${paramId} of session namespace ${namespace}`,
							);
					});

					// update values and return execution promises
					// TODO SS-8042 this could be optimized by supporting changes of multiple parameters
					// at once, which would require a refactoring of the state management
					const promises = paramIds.map((paramId) => {
						const store = stores[paramId];
						const {actions} = store.getState();
						actions.setUiValue(values[paramId]);
						return actions.execute(false, skipHistory);
					});

					const {parameterChanges} = get();
					const changes = parameterChanges[namespace];
					await Promise.all([
						changes.accept(skipHistory),
						...promises,
					]);
				},

				getDefaultState(): ISessionsHistoryState {
					const {parameterStores} = get();
					const state: ISessionsHistoryState = {};
					Object.keys(parameterStores).forEach((namespace) => {
						const stores = parameterStores[namespace];
						state[namespace] = Object.keys(stores).reduce(
							(acc, paramId) => {
								const store = stores[paramId];
								const {
									definition: {defval},
								} = store.getState();
								acc[paramId] = defval;

								return acc;
							},
							{} as {[paramId: string]: string},
						);
					});

					return state;
				},

				resetHistory() {
					set(
						() => ({
							history: [],
							historyIndex: -1,
						}),
						false,
						"resetHistory",
					);
				},

				pushHistoryState(state: ISessionsHistoryState) {
					const {history, historyIndex} = get();
					const entry: IHistoryEntry = {state, time: Date.now()};
					const newHistory = history
						.slice(0, historyIndex + 1)
						.concat(entry);
					set(
						() => ({
							history: newHistory,
							historyIndex: newHistory.length - 1,
						}),
						false,
						"pushHistoryState",
					);

					return entry;
				},

				async restoreHistoryState(
					state: ISessionsHistoryState,
					skipHistory?: boolean,
				) {
					const {batchParameterValueUpdate} = get();
					const namespaces = Object.keys(state);
					const promises = namespaces.map((namespace) =>
						batchParameterValueUpdate(
							namespace,
							state[namespace],
							skipHistory,
						),
					);
					await Promise.all(promises);
				},

				async restoreHistoryStateFromIndex(index: number) {
					const {history, restoreHistoryState} = get();

					if (index < 0 || index >= history.length)
						throw new Error(`Invalid history index ${index}`);

					const entry = history[index];
					await restoreHistoryState(entry.state, true);

					set(
						() => ({
							historyIndex: index,
						}),
						false,
						"restoreHistoryState",
					);
				},

				async restoreHistoryStateFromTimestamp(time: number) {
					const {history, restoreHistoryStateFromIndex} = get();
					const index = history.findIndex(
						(entry) => entry.time === time,
					);
					if (index < 0)
						throw new Error(
							`No history entry found for timestamp ${time}`,
						);

					await restoreHistoryStateFromIndex(index);
				},

				async restoreHistoryStateFromEntry(entry: IHistoryEntry) {
					const {
						history,
						restoreHistoryState,
						restoreHistoryStateFromIndex,
						restoreHistoryStateFromTimestamp,
					} = get();
					try {
						await restoreHistoryStateFromTimestamp(entry.time);
						console.debug(
							`Restored parameter values from history at timestamp ${entry.time}`,
							entry,
						);
					} catch {
						// find history entry whose parameter values match the given entry
						const index = history.findIndex((e) => {
							const namespaces = Object.keys(e.state);
							if (
								namespaces.length !==
								Object.keys(entry.state).length
							)
								return false;

							return namespaces.every((namespace) => {
								if (!(namespace in entry.state)) return false;
								const values = e.state[namespace];
								const entryValues = entry.state[namespace];
								const valueKeys = Object.keys(values);
								const entryKeys = Object.keys(entryValues);
								if (valueKeys.length !== entryKeys.length)
									return false;

								return valueKeys.every(
									(key) => values[key] === entryValues[key],
								);
							});
						});
						if (index >= 0) {
							console.debug(
								`Restoring parameter values from history at index ${index}`,
								entry,
							);
							await restoreHistoryStateFromIndex(index);
						} else {
							console.debug(
								"No matching history entry found, directly restoring parameter values",
								entry,
							);
							await restoreHistoryState(entry.state);
						}
					}
				},
			}),
			{...devtoolsSettings, name: "ShapeDiver | Parameters"},
		),
	);
