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

	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
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
				const {
					modelState: {parameters},
				} = await sessionApi.getModelState(trimmedId);

				const sessionParameters = useShapeDiverStoreParameters
					.getState()
					.getParameters(namespace);
				const acceptRejectMode = Object.values(sessionParameters).some(
					(p) => !!p?.getState().acceptRejectMode,
				);

				batchParameterValueUpdate(
					namespace,
					parameters,
					!acceptRejectMode,
				);

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
		[namespace],
	);

	return {
		importModelState,
		isLoading,
	};
}
