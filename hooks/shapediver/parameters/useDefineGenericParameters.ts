import { useEffect } from "react";
import { useShapeDiverStoreParameters } from "../../../store/useShapeDiverStoreParameters";
import { IAcceptRejectModeSelector, IGenericParameterDefinition, IGenericParameterExecutor } from "../../../types/store/shapediverStoreParameters";
import { useShallow } from "zustand/react/shallow";


/**
 * Hook for defining generic parameters to be displayed in the UI. 
 * Generic parameters are not based on parameters exposed by a ShapeDiver model. 
 * They allow you to add custom controls to your web app. 
 * CAUTION: Changes to the executor or acceptRejectMode are not reactive.
 * 
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 *
 * @param namespace The namespace to use for the parameters.
 * @param acceptRejectMode Set to true to require confirmation of the user to accept or reject changed parameter values
 * @param definitions Definitions of the parameters.
 * @param executor Executor of parameter changes.
 * @returns
 */
export function useDefineGenericParameters(
	namespace: string, 
	acceptRejectMode: boolean | IAcceptRejectModeSelector, 
	definitions: IGenericParameterDefinition | IGenericParameterDefinition[], 
	executor: IGenericParameterExecutor,
	dependsOnSessions?: string[] | string | undefined
) {
	
	const { syncGeneric, removeSession } = useShapeDiverStoreParameters(
		useShallow(state => ({ syncGeneric: state.syncGeneric, removeSession: state.removeSession }))
	);
	
	// keep the generic parameters in sync
	useEffect(() => {
		syncGeneric(namespace, acceptRejectMode, definitions, executor, dependsOnSessions);
	}, [namespace, acceptRejectMode, definitions, executor, dependsOnSessions]);

	// in case the session id changes, remove the parameters for the previous session
	useEffect(() => {
		return () => {
			removeSession(namespace);
		};
	}, [namespace]);

	return {
		
	};
}
