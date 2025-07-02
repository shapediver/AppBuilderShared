import {ErrorReportingContext} from "@AppBuilderShared/context/ErrorReportingContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {exceptionWrapperAsync} from "@AppBuilderShared/utils/exceptionWrapper";
import {
	filterAndValidateModelStateParameters,
	generateParameterFeedback,
} from "@AppBuilderShared/utils/parameters/parametersFilter";
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
			const response = await exceptionWrapperAsync(
				() => sessionApi.getModelState(trimmedId),
				() => setIsLoading(false),
			);

			if (response.error) {
				errorReporting.captureException(response.error);
				notifications.error({
					message: "Failed to import model state",
				});
				return false;
			}

			const parameters = response.data.modelState?.parameters;

			if (!parameters) {
				notifications.error({
					message: "Model state does not contain parameter data",
				});
				return false;
			}

			// Get session parameters and pass to utility function
			const sessionParameters = useShapeDiverStoreParameters
				.getState()
				.getParameters(namespace);

			const validationResult = filterAndValidateModelStateParameters(
				sessionParameters,
				parameters,
			);

			if (!validationResult.hasValidParameters) {
				const feedback = generateParameterFeedback(validationResult);
				notifications[feedback.type]({
					message: feedback.message,
				});
				return false;
			}

			await batchParameterValueUpdate(
				namespace,
				validationResult.validParameters,
				!validationResult.acceptRejectMode,
			);

			// Provide user feedback
			const feedback = generateParameterFeedback(
				validationResult,
				`Model state ${trimmedId} imported successfully`,
			);

			notifications[feedback.type]({
				message: feedback.message,
			});

			return true;
		},
		[namespace],
	);

	return {
		importModelState,
		isLoading,
	};
}
