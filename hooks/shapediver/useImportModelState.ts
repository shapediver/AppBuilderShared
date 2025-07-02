import {ErrorReportingContext} from "@AppBuilderShared/context/ErrorReportingContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderShared/types/shapediver/queryparams";
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

	const sessionApi = useShapeDiverStoreSession(
		useShallow((state) => state.sessions[namespace]),
	);

	const notifications = useContext(NotificationContext);
	const errorReporting = useContext(ErrorReportingContext);

	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	/**
	 * Import a model state by ID
	 */
	const importModelState = useCallback(
		async (modelStateId: string): Promise<boolean> => {
			// sanitize input
			modelStateId = modelStateId.trim();
			if (modelStateId.startsWith("http")) {
				const url = new URL(modelStateId);
				modelStateId =
					url.searchParams.get(QUERYPARAM_MODELSTATEID) || "";
			}
			if (!modelStateId) {
				notifications.error({
					message: `Please enter a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
				});
				return false;
			}

			setIsLoading(true);
			const response = await exceptionWrapperAsync(
				() => sessionApi.getModelState(modelStateId),
				() => setIsLoading(false),
			);

			if (response.error) {
				errorReporting.captureException(response.error);
				notifications.error({
					title: "Failed to fetch model state",
					message:
						response.error.message || "An unknown error occurred",
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
			);

			// Provide user feedback
			const feedback = generateParameterFeedback(
				validationResult,
				`Model state ${modelStateId} imported successfully`,
			);

			notifications[feedback.type]({
				message: feedback.message,
			});

			return true;
		},
		[sessionApi, namespace],
	);

	return {
		importModelState,
		isLoading,
	};
}
