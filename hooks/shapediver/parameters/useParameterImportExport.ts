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
				const target = event.target as HTMLInputElement;
				const file = target.files?.[0];

				if (!file) {
					reject(new Error("No file selected"));
					return;
				}

				try {
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

					let isValidPartial = false;
					let isValidFull = true;
					let acceptRejectMode = false;
					const parametersJson = [...importData.parameters];

					parametersJson.forEach((param, index) => {
						if (!param.id || param.value === undefined) {
							parametersJson.splice(index, 1);
							if (isValidFull) isValidFull = false;
							return;
						}

						const sessionParam = sessionParameters[param.id];
						if (sessionParam) {
							if (!isValidPartial) isValidPartial = true;

							const paramActions =
								sessionParam.getState().actions;
							if (paramActions.isValid(param.value)) {
								if (sessionParam.getState().acceptRejectMode) {
									acceptRejectMode = true;
								}
							} else {
								parametersJson.splice(index, 1);
							}
						} else {
							if (isValidFull) isValidFull = false;
							parametersJson.splice(index, 1);
						}
					});

					if (isValidPartial) {
						const validParameters: {[key: string]: any} = {};
						parametersJson.forEach((param) => {
							validParameters[param.id] = param.value;
						});

						await batchParameterValueUpdate(
							namespace,
							validParameters,
							!acceptRejectMode,
						);

						if (!isValidFull) {
							notifications.warning?.({
								message:
									"The parameters of the imported file and the model do not overlap entirely.",
							});
						} else {
							notifications.success({
								message: "Parameters imported successfully",
							});
						}
						resolve();
					} else {
						const errorMessage =
							"The parameters from the imported file do not match the parameters of this model.";
						notifications.error({
							message: errorMessage,
						});
						reject(new Error(errorMessage));
					}
				} catch (error) {
					errorReporting.captureException(error);
					const errorMessage =
						"Failed to import parameters: " +
						(error as Error).message;
					notifications.error({
						message: errorMessage,
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
