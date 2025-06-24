import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useCallback, useContext} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for managing parameter import/export and reset functionality.
 */
export function useParameterImportExport(namespace: string) {
	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const {batchParameterValueUpdate} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			batchParameterValueUpdate: state.batchParameterValueUpdate,
		})),
	);

	const notifications = useContext(NotificationContext);
	const sessionApi = sessions[namespace];

	/**
	 * Export parameters as JSON file
	 */
	const exportParameters = useCallback(async () => {
		if (!sessionApi) {
			console.error("Session not available for parameter export");
			return;
		}

		try {
			// Get current parameter values from session
			const parameters = sessionApi.parameters;
			const parameterValues: {[key: string]: any} = {};

			Object.values(parameters).forEach((param) => {
				parameterValues[param.id] = param.value;
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
				message: "Parameters exported successfully",
			});
		} catch (error) {
			console.error("Error exporting parameters:", error);
			notifications.error({
				message: "Failed to export parameters",
			});
		}
	}, [namespace]);

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

					if (!sessionApi) {
						throw new Error("Session not available");
					}

					// Validate that the parameters exist in the session
					const sessionParameters = sessionApi.parameters;
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
					console.error("Error importing parameters:", error);
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
	}, [namespace]);

	/**
	 * Reset parameters to default values
	 */
	const resetParameters = useCallback(async () => {
		if (!sessionApi) {
			console.error("Session not available for parameter reset");
			return;
		}

		try {
			// Get default parameter values from session
			const defaultValues = sessionApi.parameterDefaultValues;

			if (!defaultValues || Object.keys(defaultValues).length === 0) {
				throw new Error("No default values available for this session");
			}

			// Apply default values
			await batchParameterValueUpdate(namespace, defaultValues);

			notifications.success({
				message: "Parameters reset to default values",
			});
		} catch (error) {
			console.error("Error resetting parameters:", error);
			notifications.error({
				message: "Failed to reset parameters",
			});
		}
	}, [namespace]);

	return {
		exportParameters,
		importParameters,
		resetParameters,
		sessionReady: !!sessionApi,
	};
}
