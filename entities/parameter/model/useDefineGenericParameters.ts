import {useEffect} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	IAcceptRejectModeSelector,
	IGenericParameterCommitter,
	IGenericParameterDefinition,
	IGenericParameterExecutor,
} from "../config/shapediverStoreParameters";
import {useShapeDiverStoreParameters} from "./useShapeDiverStoreParameters";

/**
 * Hook for defining generic parameters to be displayed in the UI.
 * Generic parameters are not based on parameters exposed by a ShapeDiver model.
 * They allow you to add custom controls to your web app.
 * CAUTION: Changes to the executor, commit callback, or acceptRejectMode are not reactive.
 *
 * @see {@link useShapeDiverStoreParameters} to access the abstracted parameters and exports.
 *
 * @param namespace The namespace to use for the parameters.
 * @param acceptRejectMode Set to true to require confirmation of the user to accept or reject changed parameter values
 * @param definitions Definitions of the parameters.
 * @param executor Executor of parameter changes.
 * @param dependsOnSessions Optional session namespaces the parameters depend on.
 * @param commit Optional callback for values committed without execution, see {@link IGenericParameterCommitter}.
 * @returns
 */
export function useDefineGenericParameters(
	namespace: string,
	acceptRejectMode: boolean | IAcceptRejectModeSelector,
	definitions: IGenericParameterDefinition | IGenericParameterDefinition[],
	executor: IGenericParameterExecutor,
	dependsOnSessions?: string[] | string | undefined,
	commit?: IGenericParameterCommitter,
) {
	const {syncGeneric, removeSession, loaded} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			syncGeneric: state.syncGeneric,
			removeSession: state.removeSession,
			loaded: namespace in state.parameterStores,
		})),
	);

	// keep the generic parameters in sync
	useEffect(() => {
		syncGeneric(
			namespace,
			acceptRejectMode,
			definitions,
			executor,
			dependsOnSessions,
			commit,
		);
	}, [
		namespace,
		acceptRejectMode,
		definitions,
		executor,
		dependsOnSessions,
		commit,
	]);

	// in case the session id changes, remove the parameters for the previous session
	useEffect(() => {
		return () => {
			removeSession(namespace);
		};
	}, [namespace]);

	return {
		loaded,
	};
}
