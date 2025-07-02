import {ErrorReportingContext} from "@AppBuilderShared/context/ErrorReportingContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
import {exceptionWrapperAsync} from "@AppBuilderShared/utils/exceptionWrapper";
import {
	filterAndValidateParameters,
	generateParameterFeedback,
} from "@AppBuilderShared/utils/parameters/parametersFilter";
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
		// Get current parameter values from store
		const parameters = useShapeDiverStoreParameters
			.getState()
			.getParameters(namespace);
		const parameterArray: {id: string; value: any; name: string}[] = [];

		Object.values(parameters).forEach((paramStore) => {
			const param = paramStore.getState();
			parameterArray.push({
				id: param.definition.id,
				value: param.state.execValue,
				name: param.definition.name,
			});
		});

		// Create JSON blob and download
		const jsonContent = JSON.stringify({
			...(currentModel && {model_id: currentModel.id}),
			parameters: parameterArray,
		});
		const blob = new Blob([jsonContent], {type: "application/json"});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `parameters_${namespace}_${new Date().toISOString().split("T")[0]}.json`;
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

				const importData = JSON.parse(response.data);

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

				const sessionParameters = useShapeDiverStoreParameters
					.getState()
					.getParameters(namespace);

				const validationResult = filterAndValidateParameters(
					sessionParameters,
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

				await batchParameterValueUpdate(
					namespace,
					validationResult.validParameters,
					!validationResult.acceptRejectMode,
				);

				// Provide user feedback
				const feedback = generateParameterFeedback(
					validationResult,
					"Parameters imported successfully",
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
		const parameters = useShapeDiverStoreParameters
			.getState()
			.getParameters(namespace);
		const defaultValues: {[key: string]: any} = {};

		Object.values(parameters).forEach((paramStore) => {
			const param = paramStore.getState();
			defaultValues[param.definition.id] = param.definition.defval;
		});

		if (Object.keys(defaultValues).length === 0) {
			throw new Error("No default values available for this session");
		}

		await batchParameterValueUpdate(namespace, defaultValues);

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
