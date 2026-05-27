import {
	filterAndValidateModelStateParameters,
	generateParameterFeedback,
} from "@AppBuilderLib/entities/parameter/lib/parametersFilter";
import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderLib/shared/config/queryparams";
import {ErrorReportingContext} from "@AppBuilderLib/shared/lib/ErrorReportingContext";
import {exceptionWrapperAsync} from "@AppBuilderLib/shared/lib/exceptionWrapper";
import {applyModelStateToUrl} from "@AppBuilderLib/shared/lib/modifyUrl";
import {useCallback, useContext, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	IImportModelStateData,
	IImportModelStateResult,
} from "../config/importModelState";

interface Props {
	namespace: string;
}

/**
 * Hook for managing model state import functionality.
 * @param namespace - The session namespace
 */
export function useImportModelState({namespace}: Props) {
	const [isLoading, setIsLoading] = useState(false);

	const sessionApi = useShapeDiverStoreSession(
		useShallow((state) => state.sessions[namespace]),
	);

	const notifications = useNotificationStore();
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
		async (
			props: IImportModelStateData,
		): Promise<IImportModelStateResult> => {
			let {modelStateId} = props;
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
				return {
					success: false,
					message: `Please provide a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
				};
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
				return {
					success: false,
					message: `Failed to fetch model state: ${
						response.error.message || "An unknown error occurred"
					}`,
				};
			}

			const parameters = response.data.modelState?.parameters;

			if (!parameters) {
				notifications.error({
					message: "Model state does not contain parameter data",
				});
				return {
					success: false,
					message: "Model state does not contain parameter data",
				};
			}

			const validationResult = filterAndValidateModelStateParameters(
				getParameterStates(namespace),
				parameters,
			);

			if (!validationResult.hasValidParameters) {
				const feedback = generateParameterFeedback(validationResult);
				notifications[feedback.type]({
					message: feedback.message,
				});
				return {
					success: false,
					message: feedback.message,
				};
			}

			await batchParameterValueUpdate({
				[namespace]: validationResult.validParameters,
			});

			// set as modelStateId in the URL
			applyModelStateToUrl(modelStateId, true);

			// Provide user feedback
			const feedback = generateParameterFeedback(
				validationResult,
				`Model state ${modelStateId} imported successfully`,
			);

			notifications[feedback.type]({
				message: feedback.message,
			});

			return {
				success: true,
				data: response.data,
			};
		},
		[sessionApi, namespace],
	);

	return {
		importModelState,
		isLoading,
	};
}
