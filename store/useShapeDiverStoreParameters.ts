import { create } from "zustand";
import { IShapeDiverParameter, IShapeDiverParameterDefinition, IShapeDiverParameterExecutor, IShapeDiverParameterState } from "../types/shapediver/parameter";
import { IExportApi, IParameterApi, ISessionApi } from "@shapediver/viewer";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "../store/storeSettings";
import {
	IAcceptRejectModeSelector,
	IExportResponse,
	IExportStore,
	IExportStores, IExportStoresPerSession,
	IGenericParameterDefinition,
	IGenericParameterExecutor,
	IHistoryEntry,
	IParameterChanges,
	IParameterChangesPerSession,
	IParameterStore,
	IParameterStores,
	IParameterStoresPerSession,
	IPreExecutionHook,
	ISessionDependency,
	ISessionsHistoryState,
	IShapeDiverStoreParameters
} from "../types/store/shapediverStoreParameters";
import { IShapeDiverExport, IShapeDiverExportDefinition } from "../types/shapediver/export";
import { ShapeDiverRequestCustomization, ShapeDiverRequestExport } from "@shapediver/api.geometry-api-dto-v2";
import { addValidator } from "../utils/parameterValidation";

/**
 * Create an IShapeDiverParameterExecutor for a single parameter, 
 * for use with createParameterStore.
 * 
 * @param namespace The session namespace of the parameter.
 * @param param The parameter definition.
 * @param getChanges Function for getting the change object of the parameter's session.
 * @returns 
 */
function createParameterExecutor<T>(namespace: string, param: IGenericParameterDefinition, getChanges: () => IParameterChanges): IShapeDiverParameterExecutor<T> {
	const paramId = param.definition.id;
	
	return {
		execute: async (uiValue: T | string, execValue: T | string, forceImmediate?: boolean, skipHistory?: boolean) => {
			const changes = getChanges();

			// check whether there is anything to do
			if (paramId in changes.values && uiValue === execValue) {
				console.log(`Removing change of parameter ${paramId}`);
				delete changes.values[paramId];
				// check if there are any other parameter updates queued
				if (Object.keys(changes.values).length === 0) {
					changes.reject();
				}

				return execValue;
			}
			
			// execute the change
			try {
				console.debug(`Queueing change of parameter ${paramId} to ${uiValue}`);
				changes.values[paramId] = uiValue;
				if (forceImmediate)
					setTimeout(() => changes.accept(skipHistory), 0);
				const values = await changes.wait;
				const value = paramId in values ? values[paramId] : uiValue;
				if (value !== uiValue) 
					console.debug(`Executed change of parameter ${paramId} to ${value} instead of ${uiValue} (overridden by pre-execution hook)`);
				else
					console.debug(`Executed change of parameter ${paramId} to ${uiValue}`);
				
				return value;
			}
			catch (e)// TODO provide possibility to react to exception
			{
				console.debug(`Rejecting change of parameter ${paramId} to ${uiValue}, resetting to "${execValue}"`, e ?? "(Unknown error)");
				
				return execValue;
			}
		},
		isValid: (uiValue: T | string, throwError?: boolean) => param.isValid ? param.isValid(uiValue, throwError) : true,
		stringify: (value: T | string) => param.stringify ? param.stringify(value) : value+"",
		definition: param.definition
	};
}

type DefaultExportsGetter = () => string[];
type ExportResponseSetter = (response: IExportResponse) => void;
type HistoryPusher = (entry: ISessionsHistoryState) => void;

/**
 * Create an IGenericParameterExecutor  for a session.
 * @param session 
 * @param getDefaultExports 
 * @param exportResponseSetter 
 * @returns 
 */
function createGenericParameterExecutorForSession(session: ISessionApi, 
	getDefaultExports: DefaultExportsGetter, 
	exportResponseSetter: ExportResponseSetter,
	historyPusher: HistoryPusher
) : IGenericParameterExecutor { 
	
	/**
	 * Note: This function receives key-value pairs of parameter value changes 
	 * that should be executed. 
	 * Typically this does not include all parameters defined by the session. 
	 */
	return async (values, namespace, skipHistory) => {

		// store previous values (we restore them in case of error)
		const previousValues = Object.keys(values).reduce((acc, paramId) => {
			acc[paramId] = session.parameters[paramId].value;
			
			return acc;
		}, {} as { [paramId: string]: unknown});

		// get ids of default exports that should be requested
		const exports = getDefaultExports();

		try {
			// set values and call customize
			Object.keys(values).forEach(id => session.parameters[id].value = values[id]);
		
			if (exports.length > 0) {
				// prepare body and send request
				const body: ShapeDiverRequestExport = { 
					parameters: session.parameterValues as ShapeDiverRequestCustomization, // TODO fix this
					exports, 
					outputs: Object.keys(session.outputs) 
				};
				const response = await session.requestExports(body, true);
				exportResponseSetter(response.exports as IExportResponse);
			}
			else {
				await session.customize();
			}

			if (!skipHistory) {
				const state: ISessionsHistoryState = { [session.id]: session.parameterValues };
				historyPusher(state);
			}
		}
		catch (e: any)
		{
			// in case of an error, restore the previous values
			Object.keys(previousValues).forEach(id => session.parameters[id].value = previousValues[id]);
			// TODO store error
			throw e;
		}
	};
}


/**
 * Create store for a single parameter.
 */
function createParameterStore<T>(executor: IShapeDiverParameterExecutor<T>, acceptRejectMode: boolean, defaultValue?: T | string) {
	const definition = executor.definition;

	/** The static definition of a parameter. */
	const defval = defaultValue !== undefined ? defaultValue : definition.defval;
	const state: IShapeDiverParameterState<T> = {
		uiValue: defval,
		execValue: defval,
		dirty: false
	};

	return create<IShapeDiverParameter<T>>()(devtools((set, get) => ({
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
				set((_state) => ({
					state: {
						..._state.state,
						uiValue,
						dirty: uiValue !== _state.state.execValue
					}
				}), false, "setUiValue");

				return true;
			},
			setUiAndExecValue: function (value: string | T): boolean {
				const actions = get().actions;
				if (!actions.isValid(value, false)) return false;
				set(() => ({
					state: {
						uiValue: value,
						execValue: value,
						dirty: false
					}
				}), false, "setUiAndExecValue");

				return true;
			},
			execute: async function (forceImmediate?: boolean, skipHistory?: boolean): Promise<T | string> {
				const state = get().state;
				const result = await executor.execute(state.uiValue, state.execValue, forceImmediate, skipHistory);
				// TODO in case result is not the current uiValue, we could somehow visualize
				// the fact that the uiValue gets reset here
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: result,
						execValue: result,
						dirty: false
					}
				}), false, "execute");
		
				return result;
			},
			isValid: function (value: any, throwError?: boolean | undefined): boolean {
				return executor.isValid(value, throwError);
			},
			isUiValueDifferent: function (value: any): boolean {
				const { state: { uiValue } } = get();
				
				return executor.stringify(value) !== executor.stringify(uiValue); 
			},
			resetToDefaultValue: function (): void {
				const definition = get().definition;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: definition.defval,
						dirty: definition.defval !== _state.state.execValue
					}
				}), false, "resetToDefaultValue");
			},
			resetToExecValue: function (): void {
				const state = get().state;
				set((_state) => ({
					state: {
						..._state.state,
						uiValue: state.execValue,
						dirty: false
					}
				}), false, "resetToExecValue");
			},
		}
	}
	), { ...devtoolsSettings, name: `ShapeDiver | Parameter | ${definition.id}` }));
}

/**
 * Map definition of parameter from API to store.
 * @param parameterApi 
 * @returns 
 */
function mapParameterDefinition<T>(parameterApi: IParameterApi<T>): IShapeDiverParameterDefinition {	
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
function mapExportDefinition(exportApi: IExportApi): IShapeDiverExportDefinition {
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
 * Create store for a single export.
 */
function createExportStore(session: ISessionApi, exportId: string, token?: string) {
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
			request: async (parameters?: { [key: string]: string }) => {
				const parametersComplete = parameterApis.reduce((acc, p) => {
					if ( !(p.id in acc) )
						acc[p.id] = p.stringify();

					return acc;
				}, parameters ?? {});
			
				return sessionExport.request(parametersComplete);
			},
			fetch: async (url: string) => {
				return fetch(url, {
					...(token ? { headers: { Authorization: token } } : {}),
				});
			}
		}
	}));
}

/**
 * Check if the given parameter definition matches the given parameter store
 */
function isMatchingParameterDefinition(store: IParameterStore, definition: IGenericParameterDefinition) {
	const a = store.getState().definition;
	const b = definition.definition;

	// deep comparison between a and b
	// NOTE: this is a quick and dirty solution, ideally we would compare the definitions in a more robust way
	return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Check if the given parameter value matches the executed value in the parameter store
 */
function isMatchingExecutedParameterValue(store: IParameterStore, definition: IGenericParameterDefinition) {
	const { execValue } = store.getState().state;
	const value = definition.value;

	return value === undefined || execValue === value;
}

/**
 * Store data related to abstracted parameters and exports.
 * @see {@link IShapeDiverStoreParameters}
 */
export const useShapeDiverStoreParameters = create<IShapeDiverStoreParameters>()(devtools((set, get) => ({

	parameterStores: {},
	exportStores: {},
	sessionDependency: {},
	parameterChanges: {},
	defaultExports: {},
	defaultExportResponses: {},
	preExecutionHooks: {},
	history: [],
	historyIndex: -1,

	removeChanges: (namespace: string) => {
		const { parameterChanges } = get();

		// check if there is something to remove
		if (!parameterChanges[namespace])
			return;

		// create a new object, omitting the session to be removed
		const changes: IParameterChangesPerSession = {};
		Object.keys(parameterChanges).forEach(id => {
			if (id !== namespace)
				changes[id] = parameterChanges[id];
		});
		
		set(() => ({
			parameterChanges: changes,
		}), false, "removeChanges");
	},

	getChanges: (
		namespace: string, 
		executor: IGenericParameterExecutor, 
		priority: number, 
		preExecutionHook?: IPreExecutionHook
	) : IParameterChanges => {
		const { parameterChanges, removeChanges } = get();
		if ( parameterChanges[namespace] )
			return parameterChanges[namespace];

		const changes: IParameterChanges = {
			values: {},
			accept: () => Promise.resolve(),
			reject: () => undefined,
			wait: Promise.resolve({}),
			executing: false,
			priority,
		};
	
		changes.wait = new Promise((resolve, reject) => {
			changes.accept = async (skipHistory) => {
				try {
					// get executor promise, but don't wait for it yet
					const amendedValues = preExecutionHook ? await preExecutionHook(changes.values, namespace) : changes.values;
					const promise = executor(amendedValues, namespace, skipHistory);
					// set "executing" mode
					set((_state) => ({
						parameterChanges: {
							..._state.parameterChanges,
							...{ [namespace]: {
								..._state.parameterChanges[namespace],
								executing: true
							} }
						}
					}), false, "executeChanges");
					// wait for execution
					await promise;
					resolve(amendedValues);
				} 
				catch (e: any)
				{
					reject(e);
				}
				finally 
				{
					removeChanges(namespace);
				}
			};
			changes.reject = () => {
				removeChanges(namespace);
				reject();
			};

			set((_state) => ({
				parameterChanges: {
					..._state.parameterChanges,
					...{ [namespace]: changes }
				}
			}), false, "getChanges");
		});

		return changes;
	},

	addSession: (session: ISessionApi, _acceptRejectMode: boolean | IAcceptRejectModeSelector, token?: string) => {
		const sessionId = session.id;
		const { 
			parameterStores: parameters, 
			exportStores: exports, 
			getChanges,
			pushHistoryState,
		} = get();

		// check if there is something to add
		if (parameters[sessionId] || exports[sessionId])
			return;

		const getDefaultExports = () => {
			return get().defaultExports[sessionId] || [];
		};
		const setExportResponse = (response: IExportResponse) => {
			set((_state) => ({
				defaultExportResponses: {
					..._state.defaultExportResponses,
					...{ [sessionId]: response }
				}
			}), false, "setExportResponse");
		};
		const historyPusher = (state: ISessionsHistoryState) => {
			const entry = pushHistoryState(state);
			history.pushState(entry, "", "");
		};
		const executor = createGenericParameterExecutorForSession(session, getDefaultExports, setExportResponse, historyPusher);

		const acceptRejectModeSelector = typeof(_acceptRejectMode) === "boolean" ? () => _acceptRejectMode : _acceptRejectMode;

		set((_state) => ({
			parameterStores: {
				..._state.parameterStores,
				...parameters[sessionId]
					? {} // Keep existing parameter stores
					: {	[sessionId]: Object.keys(session.parameters).reduce((acc, paramId) => {
						const param = session.parameters[paramId];
						const acceptRejectMode = acceptRejectModeSelector(param);
						acc[paramId] = createParameterStore(createParameterExecutor(sessionId, 
							{ 
								definition: mapParameterDefinition(param), 
								isValid: (value, throwError) => param.isValid(value, throwError),
								stringify: (value) => param.stringify(value)
							}, 
							() => {
								const { preExecutionHooks } = get();
								
								return getChanges(sessionId, executor, 0, preExecutionHooks[sessionId]);
							}
						), acceptRejectMode, param.value);

						return acc;
					}, {} as IParameterStores) } // Create new parameter stores
			},
			exportStores: {
				..._state.exportStores,
				...exports[sessionId]
					? {} // Keep existing export stores
					: { [sessionId]: Object.keys(session.exports).reduce((acc, exportId) => {
						acc[exportId] = createExportStore(session, exportId, token);

						return acc;
					}, {} as IExportStores) } // Create new export stores
			},
			sessionDependency: {
				..._state.sessionDependency,
				...{ [sessionId]: [sessionId] }
			},
		}), false, "addSession");
	},

	addGeneric: (
		namespace: string, 
		_acceptRejectMode: boolean | IAcceptRejectModeSelector, 
		definitions: IGenericParameterDefinition | IGenericParameterDefinition[], 
		executor: IGenericParameterExecutor,
		dependsOnSessions: string[] | string | undefined,
	) => {
		const { parameterStores: parameters, getChanges } = get();

		// check if there is something to add
		if (parameters[namespace])
			return;

		const acceptRejectModeSelector = typeof(_acceptRejectMode) === "boolean" ? () => _acceptRejectMode : _acceptRejectMode;

		set((_state) => ({
			parameterStores: {
				..._state.parameterStores,
				...parameters[namespace]
					? {} // Keep existing parameter stores
					: {	[namespace]: (Array.isArray(definitions) ? definitions : [definitions]).reduce((acc, def) => {
						def = addValidator(def);
						const paramId = def.definition.id;
						const acceptRejectMode = acceptRejectModeSelector(def.definition);
						acc[paramId] = createParameterStore(createParameterExecutor(namespace, def, 
							() => getChanges(namespace, executor, -1)
						), acceptRejectMode);

						return acc;
					}, {} as IParameterStores) } // Create new parameter stores
			},
			sessionDependency: {
				..._state.sessionDependency,
				...{ [namespace]: Array.isArray(dependsOnSessions) ? dependsOnSessions : dependsOnSessions ? [dependsOnSessions] : [] }
			},
		}), false, "addGeneric");
	},

	syncGeneric: (
		namespace: string, 
		_acceptRejectMode: boolean | IAcceptRejectModeSelector, 
		definitions: IGenericParameterDefinition | IGenericParameterDefinition[], 
		executor: IGenericParameterExecutor,
		dependsOnSessions: string[] | string | undefined,
	) => {
		const { parameterStores: parameterStorePerSession, getChanges } = get();
		definitions = Array.isArray(definitions) ? definitions : [definitions];

		const acceptRejectModeSelector = typeof(_acceptRejectMode) === "boolean" ? () => _acceptRejectMode : _acceptRejectMode;

		const existingParameterStores = parameterStorePerSession[namespace] ?? {};
		let hasChanges = false;
		const parameterStores: IParameterStores = {};
		
		definitions.forEach(def => {
			def = addValidator(def);
			const paramId = def.definition.id;
			// check if a matching parameter store already exists
			if (paramId in existingParameterStores && isMatchingParameterDefinition(existingParameterStores[paramId], def)) {
				parameterStores[paramId] = existingParameterStores[paramId];
				if (!isMatchingExecutedParameterValue(existingParameterStores[paramId], def)) {
					const { actions } = parameterStores[paramId].getState();
					if (!actions.setUiAndExecValue(def.value)) {
						console.warn(`Could not update value of generic parameter ${paramId} to ${def.value}`);
					}
					else {
						console.debug(`Updated value of generic parameter ${paramId} to ${def.value}`);
					}
				}
			} 
			else {
				const acceptRejectMode = acceptRejectModeSelector(def.definition);
				parameterStores[paramId] = createParameterStore(createParameterExecutor(namespace, def, 
					() => getChanges(namespace, executor, -1)
				), acceptRejectMode);
				hasChanges = true;
			}
		});

		if (!hasChanges && Object.keys(existingParameterStores).length === Object.keys(parameterStores).length)
			return;
	
		set((_state) => ({
			parameterStores: {
				..._state.parameterStores,
				...{ [namespace]: parameterStores }
			},
			sessionDependency: {
				..._state.sessionDependency,
				...{ [namespace]: Array.isArray(dependsOnSessions) ? dependsOnSessions : dependsOnSessions ? [dependsOnSessions] : [] }
			},
		}), false, "syncGeneric");
	},

	removeSession: (namespace: string) => {
		const {
			parameterStores: parametersPerSession, 
			exportStores: exportsPerSession,
			sessionDependency,
		} = get();

		// check if there is something to remove
		if (!parametersPerSession[namespace] && !exportsPerSession[namespace])
			return;

		// create a new object, omitting the session to be removed
		const parameters: IParameterStoresPerSession = {};
		Object.keys(parametersPerSession).forEach(id => {
			if (id !== namespace)
				parameters[id] = parametersPerSession[id];
		});

		// create a new object, omitting the session to be removed
		const exports: IExportStoresPerSession = {};
		Object.keys(exportsPerSession).forEach(id => {
			if (id !== namespace)
				exports[id] = exportsPerSession[id];
		});

		// create a new object, omitting the session to be removed
		const dependency: ISessionDependency = {};
		Object.keys(sessionDependency).forEach(id => {
			if (id !== namespace)
				dependency[id] = sessionDependency[id];
		});

		set(() => ({
			parameterStores: parameters,
			exportStores: exports,
			sessionDependency: dependency,
		}), false, "removeSession");
	},
	
	getParameters: (namespace: string) => {
		return get().parameterStores[namespace] || {};
	},

	getParameter: (namespace: string, paramId: string, type?: string) => {
		return Object.values(get().getParameters(namespace)).find(p => {
			const def = p.getState().definition;

			return (!type || type === def.type ) && (def.id === paramId || def.name === paramId || def.displayname === paramId);
		}) as IParameterStore;
	},

	getExports: (namespace: string) => {
		return get().exportStores[namespace] || {};
	},

	getExport: (namespace: string, exportId: string) => {
		return Object.values(get().getExports(namespace)).find(p => {
			const def = p.getState().definition;

			return def.id === exportId || def.name === exportId || def.displayname === exportId;
		}) as IExportStore;
	},

	registerDefaultExport: (namespace: string, exportId: string | string[]) => {
		const exportIds = Array.isArray(exportId) ? exportId : [exportId];
		if (exportIds.length === 0)
			return;
		const { defaultExports } = get();
		const existing = defaultExports[namespace];
		const filtered = existing ? exportIds.filter(id => existing.indexOf(id) < 0) : exportIds;
		const newExports = existing ? existing.concat(filtered) : exportIds;

		set((_state) => ({
			defaultExports: {
				..._state.defaultExports,
				...{ [namespace]: newExports }
			}
		}), false, "registerDefaultExport");
	},

	deregisterDefaultExport: (namespace: string, exportId: string | string[]) => {
		const { defaultExports, defaultExportResponses } = get();
		
		const exportIds = Array.isArray(exportId) ? exportId : [exportId];
		if (exportIds.length === 0)
			return;
		
		const existingDefaultExports = defaultExports[namespace];
		if (!existingDefaultExports) 
			return;
		
		const newDefaultExports = existingDefaultExports.filter(id => exportIds.indexOf(id) < 0);
		if (newDefaultExports.length === existingDefaultExports.length)
			return;
		
		const existingDefaultExportResponses = defaultExportResponses[namespace] ?? {};
		const newDefaultExportResponses: IExportResponse = {};
		Object.keys(existingDefaultExportResponses).forEach(id => {
			if (exportIds.indexOf(id) < 0)
				newDefaultExportResponses[id] = existingDefaultExportResponses[id];
		});
	
		set((_state) => ({
			defaultExports: {
				..._state.defaultExports,
				...{ [namespace]: newDefaultExports }
			},
			defaultExportResponses: {
				..._state.defaultExportResponses,
				...{ [namespace]: newDefaultExportResponses }
			}
		}), false, "deregisterDefaultExport");
	},

	setPreExecutionHook: (namespace: string, hook: IPreExecutionHook) => {
		if (!namespace) return;

		const { preExecutionHooks } = get();
		if (namespace in preExecutionHooks)
			console.warn(`Pre-execution hook for session namespace ${namespace} already exists, overwriting it.`);
		
		set((_state) => ({
			preExecutionHooks: {
				..._state.preExecutionHooks,
				...{ [namespace]: hook }
			}
		}), false, "setPreExecutionHook");
	},

	removePreExecutionHook: (namespace: string) => {
		if (!namespace) return;

		const { preExecutionHooks } = get();
		if (!preExecutionHooks[namespace])
			return;

		const hooks: { [key: string]: IPreExecutionHook } = {};
		Object.keys(preExecutionHooks).forEach(id => {
			if (id !== namespace)
				hooks[id] = preExecutionHooks[id];
		});

		set(() => ({
			preExecutionHooks: hooks
		}), false, "removePreExecutionHook");
	},

	async batchParameterValueUpdate(namespace: string, values: { [key: string]: string }, skipHistory?: boolean) {
		const { parameterStores } = get();
		const stores = parameterStores[namespace];
		if (!stores)
			return;

		const paramIds = Object.keys(values);

		// verify that all parameter stores exist and values are valid
		paramIds.forEach(paramId => {
			const store = stores[paramId];
			if (!store) 
				throw new Error(`Parameter ${paramId} does not exist for session namespace ${namespace}`);
		
			const { actions } = store.getState();
			const value = values[paramId];
			if (!actions.isValid(value)) 
				throw new Error(`Value ${value} is not valid for parameter ${paramId} of session namespace ${namespace}`);
		});

		// update values and return execution promises
		// TODO SS-8042 this could be optimized by supporting changes of multiple parameters 
		// at once, which would require a refactoring of the state management
		const promises = paramIds.map((paramId, index) => {
			const store = stores[paramId];
			const { actions } = store.getState();
			actions.setUiValue(values[paramId]);
			
			// once we reach the last parameter, we execute the changes immediately
			return actions.execute(index === paramIds.length - 1, skipHistory);
		});

		await Promise.all(promises);
	},

	getDefaultState(): ISessionsHistoryState {
		const { parameterStores } = get();
		const state: ISessionsHistoryState = {};
		Object.keys(parameterStores).forEach(namespace => {
			const stores = parameterStores[namespace];
			state[namespace] = Object.keys(stores).reduce((acc, paramId) => {
				const store = stores[paramId];
				const { definition: { defval } } = store.getState();
				acc[paramId] = defval;

				return acc;
			}, {} as { [paramId: string]: string });

		});

		return state;
	},

	resetHistory() {
		set(() => ({
			history: [],
			historyIndex: -1
		}), false, "resetHistory");
	},

	pushHistoryState(state: ISessionsHistoryState) {
		const { history, historyIndex } = get();
		const entry: IHistoryEntry = { state, time: Date.now() };
		const newHistory = history.slice(0, historyIndex + 1).concat(entry);
		set(() => ({
			history: newHistory,
			historyIndex: newHistory.length - 1
		}), false, "pushHistoryState");
		
		return entry;
	},

	async restoreHistoryState(state: ISessionsHistoryState, skipHistory?: boolean) {
		const { batchParameterValueUpdate } = get();
		const namespaces = Object.keys(state);
		const promises = namespaces.map(namespace => batchParameterValueUpdate(namespace, state[namespace], skipHistory));
		await Promise.all(promises);
	},

	async restoreHistoryStateFromIndex(index: number) {
		const { history, restoreHistoryState } = get();

		if (index < 0 || index >= history.length)
			throw new Error(`Invalid history index ${index}`);

		const entry = history[index];
		await restoreHistoryState(entry.state, true);

		set(() => ({
			historyIndex: index
		}), false, "restoreHistoryState");
	},

	async restoreHistoryStateFromTimestamp(time: number) {
		const { history, restoreHistoryStateFromIndex } = get();
		const index = history.findIndex(entry => entry.time === time);
		if (index < 0)
			throw new Error(`No history entry found for timestamp ${time}`);

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
			console.debug(`Restored parameter values from history at timestamp ${entry.time}`, entry);
		}
		catch {
			// find history entry whose parameter values match the given entry
			const index = history.findIndex(e => {
				const namespaces = Object.keys(e.state);
				if (namespaces.length !== Object.keys(entry.state).length)
					return false;
				
				return namespaces.every(namespace => {
					if (!(namespace in entry.state))
						return false;
					const values = e.state[namespace];
					const entryValues = entry.state[namespace];
					const valueKeys = Object.keys(values);
					const entryKeys = Object.keys(entryValues);
					if (valueKeys.length !== entryKeys.length)
						return false;
					
					return valueKeys.every(key => values[key] === entryValues[key]);
				});
			});
			if (index >= 0) {
				console.debug(`Restoring parameter values from history at index ${index}`, entry);
				await restoreHistoryStateFromIndex(index);
			} else {
				console.debug("No matching history entry found, directly restoring parameter values", entry);
				await restoreHistoryState(entry.state);
			}
		}
	},

}
), { ...devtoolsSettings, name: "ShapeDiver | Parameters" }));
