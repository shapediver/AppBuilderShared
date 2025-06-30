import {ErrorReportingContext} from "@AppBuilderShared/context/ErrorReportingContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStorePlatform} from "@AppBuilderShared/store/useShapeDiverStorePlatform";
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
		try {
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
		} catch (error) {
			errorReporting.captureException(error);
			notifications.error({
				message: "Failed to export parameters",
			});
		}
	}, [namespace, currentModel]);

	/**
	 * Import parameters from JSON file
	 */
	const importParameters = useCallback(async () => {
		return new Promise<void>((resolve, reject) => {
			const fileInput = document.createElement("input");
			fileInput.type = "file";
			fileInput.accept = ".json";

			fileInput.onchange = async (event: Event) => {
				try {
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

					const text = await file.text();
					const importData = JSON.parse(text);

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

					const validParameters: {[key: string]: any} = {};
					const missingParameters: string[] = [];
					let acceptRejectMode = false;

					for (const param of importData.parameters) {
						if (!param.id || param.value === undefined) {
							continue;
						}

						const sessionParam =
							sessionParameters[param.id] ||
							sessionParameters[param.name];

						if (!sessionParam) {
							missingParameters.push(param.name || param.id);
							continue;
						}

						const paramActions = sessionParam.getState().actions;
						if (!paramActions.isValid(param.value)) {
							missingParameters.push(param.name || param.id);
							continue;
						}

						if (sessionParam.getState().acceptRejectMode) {
							acceptRejectMode = true;
						}

						validParameters[param.id] = param.value;
					}

					if (Object.keys(validParameters).length === 0) {
						const errorMessage =
							"The parameters from the imported file do not match the parameters of this model.";
						notifications.error({
							message: errorMessage,
						});
						reject(new Error(errorMessage));
						return;
					}

					await batchParameterValueUpdate(
						namespace,
						validParameters,
						!acceptRejectMode,
					);

					if (missingParameters.length > 0) {
						notifications.warning?.({
							message: `The following parameters are missing: ${missingParameters.join(", ")}`,
						});
					} else {
						notifications.success({
							message: "Parameters imported successfully",
						});
					}

					resolve();
				} catch (error) {
					errorReporting.captureException(error);
					notifications.error({
						message: (error as Error).message,
					});
					reject(error);
				}
			};

			fileInput.click();
		});
	}, [namespace, notifications]);

	/**
	 * Reset parameters to default values
	 */
	const resetParameters = useCallback(async () => {
		try {
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
		} catch (error) {
			errorReporting.captureException(error);
			notifications.error({
				message: "Failed to reset parameters",
			});
		}
	}, [namespace]);

	return {
		exportParameters,
		importParameters,
		resetParameters,
	};
}
