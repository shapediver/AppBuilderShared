import { ErrorReportingContext } from "@AppBuilderShared/context/ErrorReportingContext";
import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
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
			const parameterValues: {[key: string]: any} = {};

			Object.values(parameters).forEach((paramStore) => {
				const param = paramStore.getState();
				parameterValues[param.definition.id] = param.state.uiValue;
			});

			// Create JSON blob and download
			const jsonContent = JSON.stringify(parameterValues, null, 2);
			const blob = new Blob([jsonContent], {type: "application/json"});
			const url = URL.createObjectURL(blob);

			// Create download link
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
	}, [namespace, errorReporting]);

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
					const parameterValues = JSON.parse(text);

					// Get current parameters from store for validation
					const sessionParameters = useShapeDiverStoreParameters
						.getState()
						.getParameters(namespace);
					const validParameters: {[key: string]: any} = {};

					Object.keys(parameterValues).forEach((paramId) => {
						if (paramId in sessionParameters) {
							validParameters[paramId] = parameterValues[paramId];
						} else {
							console.warn(
								`Parameter ${paramId} not found in session, skipping`,
							);
						}
					});

					if (Object.keys(validParameters).length === 0) {
						throw new Error("No valid parameters found in file");
					}

					// Apply parameter values
					await batchParameterValueUpdate(namespace, validParameters);

					notifications.success({
						message: "Parameters imported successfully",
					});
					resolve();
				} catch (error) {
					errorReporting.captureException(error);
					notifications.error({
						message:
							"Failed to import parameters: " +
							(error as Error).message,
					});
					reject(error);
				}
			};

			fileInput.click();
		});
	}, [namespace, errorReporting]);

	/**
	 * Reset parameters to default values
	 */
	const resetParameters = useCallback(async () => {
		try {
			// Get parameters from store and build default values
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

			// Apply default values
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
	}, [namespace, errorReporting]);

	return {
		exportParameters,
		importParameters,
		resetParameters,
	};
}
