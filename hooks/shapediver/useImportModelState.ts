import {ErrorReportingContext} from "@AppBuilderShared/context/ErrorReportingContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useCallback, useContext, useState} from "react";
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
	const errorReporting = useContext(ErrorReportingContext);
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
					message: `Model state ${trimmedId} imported successfully`,
				});

				return true;
			} catch (error) {
				errorReporting.captureException(error);
				notifications.error({
					message: "Failed to import model state",
				});
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[sessionApi, notifications, getParameters, namespace, errorReporting],
	);

	return {
		importModelState,
		isLoading,
	};
}
