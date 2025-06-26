import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderShared/types/shapediver/queryparams";
import {useCallback, useContext, useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for managing model state import functionality.
 * @param namespace - The session namespace
 */
export function useImportModelState(namespace: string) {
	const [isLoading, setIsLoading] = useState(false);

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const notifications = useContext(NotificationContext);
	const sessionApi = sessions[namespace];

	// Get parameter store functions for updating parameter values
	const {getParameters} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			getParameters: state.getParameters,
		})),
	);

	/**
	 * Import a model state by ID
	 */
	const importModelState = useCallback(
		async (modelStateId: string) => {
			if (!sessionApi) {
				notifications.error({
					message: "Session not available",
				});
				return false;
			}

			const trimmedId = modelStateId.trim();
			if (!trimmedId) {
				notifications.error({
					message: "Please enter a valid model state ID",
				});
				return false;
			}

			setIsLoading(true);
			try {
				await sessionApi.customizeWithModelState(trimmedId);

				// Update parameter values in the store to reflect the new model state
				const parameterStores = getParameters(namespace);
				Object.keys(parameterStores).forEach((paramId) => {
					const store = parameterStores[paramId];
					const sessionParam = sessionApi.parameters[paramId];
					if (sessionParam && store) {
						const {actions} = store.getState();
						// Update both UI and execution values to match the session
						actions.setUiAndExecValue(sessionParam.value);
					}
				});

				notifications.success({
					message: "Model state imported successfully",
				});

				return true;
			} catch (error) {
				console.error("Error importing model state:", error);
				notifications.error({
					message: "Failed to import model state",
				});
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[sessionApi, notifications, getParameters, namespace],
	);

	// Check for modelStateId query parameter on mount and apply it
	useEffect(() => {
		if (!sessionApi) return;

		const url = new URL(window.location.href);
		const modelStateId = url.searchParams.get(QUERYPARAM_MODELSTATEID);

		if (modelStateId) {
			importModelState(modelStateId);
		}
	}, [sessionApi, importModelState]);

	return {
		importModelState,
		isLoading,
	};
}
