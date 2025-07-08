import {ErrorReportingContext} from "@AppBuilderShared/context/ErrorReportingContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {
	exceptionWrapper,
	exceptionWrapperAsync,
} from "@AppBuilderShared/utils/exceptionWrapper";
import {
	filterAndValidateParameters,
	generateParameterFeedback,
	isImportParameterArray,
} from "@AppBuilderShared/utils/parameters/parametersFilter";
import {getParameterStates} from "@AppBuilderShared/utils/parameters/parameterStates";
import {useCallback, useContext} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for managing parameter import/export and reset functionality.
 */
export function useParameterImportExport(namespace: string) {
	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const {currentModel} = useShapeDiverStorePlatform(
		useShallow((state) => ({
			currentModel: state.currentModel,
		})),
	);

	const notifications = useContext(NotificationContext);
	const errorReporting = useContext(ErrorReportingContext);

	/**
	 * Export parameters as JSON file
	 */
	const exportParameters = useCallback(async () => {
		const parameterArray = getParameterStates(namespace).map((param) => ({
			id: param.definition.id,
			value: param.state.execValue,
			name: param.definition.name,
		}));

		// Create JSON blob and download
		const jsonContent = JSON.stringify({
			...(currentModel && {model_id: currentModel.id}),
			parameters: parameterArray,
		});
		const blob = new Blob([jsonContent], {type: "application/json"});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `parameters_${currentModel ? currentModel.slug : namespace}_${new Date().toISOString().split("T")[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		notifications.success({
			message: "Parameter values exported successfully",
		});
	}, [namespace, currentModel]);

	/**
	 * Import parameters from JSON file
	 */
	const importParameters = useCallback(() => {
		return new Promise<void>((resolve, reject) => {
			const fileInput = document.createElement("input");
			fileInput.type = "file";
			fileInput.accept = ".json";

			fileInput.onchange = async (event: Event) => {
				const target = event.target as HTMLInputElement;
				const file = target.files?.[0];

				if (!file) {
					const errorMessage = "No file selected";
					notifications.error({
						message: errorMessage,
					});
					reject(new Error(errorMessage));
					return;
				}

				const response = await exceptionWrapperAsync<string>(() =>
					file.text(),
				);

				if (response.error) {
					errorReporting.captureException(response.error);
					notifications.error({
						message: (response.error as Error).message,
					});
					reject(response.error);
					return;
				}

				const importResult = exceptionWrapper(() =>
					JSON.parse(response.data),
				);

				if (importResult.error) {
					errorReporting.captureException(importResult.error);
					notifications.error({
						message: (importResult.error as Error).message,
					});
					reject(importResult.error);
					return;
				}

				const importData = importResult.data;

				if (
					!importData.parameters ||
					!Array.isArray(importData.parameters)
				) {
					const errorMessage =
						"The file doesn't contain the parameters data";
					notifications.error({
						message: errorMessage,
					});
					reject(new Error(errorMessage));
					return;
				}

				if (!isImportParameterArray(importData.parameters)) {
					const errorMessage =
						"The schema of the parameters is not valid";
					notifications.error({
						message: errorMessage,
					});
					reject(new Error(errorMessage));
					return;
				}

				const validationResult = filterAndValidateParameters(
					getParameterStates(namespace),
					importData.parameters,
				);

				if (!validationResult.hasValidParameters) {
					const feedback =
						generateParameterFeedback(validationResult);
					notifications[feedback.type]({
						message: feedback.message,
					});
					reject(new Error(feedback.message));
					return;
				}

				await batchParameterValueUpdate({
					[namespace]: validationResult.validParameters,
				});

				// Provide user feedback
				const feedback = generateParameterFeedback(
					validationResult,
					"Parameter values imported successfully",
				);

				notifications[feedback.type]({
					message: feedback.message,
				});

				resolve();
			};

			fileInput.click();
		});
	}, [namespace, notifications]);

	/**
	 * Reset parameters to default values
	 */
	const resetParameters = useCallback(async () => {
		const defaultValues = getParameterStates(namespace).reduce(
			(acc, param) => {
				acc[param.definition.id] = param.definition.defval;
				return acc;
			},
			{} as Record<string, any>,
		);

		await batchParameterValueUpdate({[namespace]: defaultValues});

		notifications.success({
			message: "Parameters reset to default values",
		});
	}, [namespace]);

	return {
		exportParameters,
		importParameters,
		resetParameters,
	};
}
