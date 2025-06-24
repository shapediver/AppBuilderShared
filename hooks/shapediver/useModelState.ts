import {NotificationContext} from "@AppBuilderShared/context/NotificationContext";
import {useViewportId} from "@AppBuilderShared/hooks/shapediver/viewer/useViewportId";
import {useShapeDiverStoreParameters} from "@AppBuilderShared/store/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderShared/store/useShapeDiverStoreSession";
import {useShapeDiverStoreViewportAccessFunctions} from "@AppBuilderShared/store/useShapeDiverStoreViewportAccessFunctions";
import {useCallback, useContext, useEffect, useState} from "react";
import {useShallow} from "zustand/react/shallow";

/**
 * Hook for managing model state creation and import functionality.
 * @param namespace - The session namespace
 */
export function useModelState(namespace: string) {
	const [isCreatingModelState, setIsCreatingModelState] = useState(false);
	const [isImportingModelState, setIsImportingModelState] = useState(false);

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const notifications = useContext(NotificationContext);
	const sessionApi = sessions[namespace];

	// Get viewport for screenshot functionality
	const {viewportId} = useViewportId();
	const {getScreenshot} = useShapeDiverStoreViewportAccessFunctions(
		useShallow((state) => ({
			getScreenshot:
				state.viewportAccessFunctions[viewportId]?.getScreenshot,
		})),
	);

	// Get parameter store functions for updating parameter values
	const {getParameters} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			getParameters: state.getParameters,
		})),
	);

	/**
	 * Create a model state from current parameter values
	 */
	const createModelState = useCallback(async () => {
		if (!sessionApi) {
			notifications.error({
				message: "Session not available",
			});
			return undefined;
		}

		setIsCreatingModelState(true);
		try {
			// Get screenshot if available
			const screenshot = getScreenshot
				? await getScreenshot()
				: undefined;

			const modelStateId = await sessionApi.createModelState(
				undefined, // use current parameter values
				false, // don't force parameter values
				screenshot, // include screenshot
				undefined, // no custom data
				undefined, // no token
			);

			// Add modelStateId as query parameter
			const url = new URL(window.location.href);
			url.searchParams.set("modelStateId", modelStateId);
			window.history.replaceState({}, "", url.toString());

			notifications.success({
				message: "Model state successfully created",
			});

			return modelStateId;
		} catch (error) {
			console.error("Error creating model state:", error);
			notifications.error({
				message: "Failed to create model state",
			});
			return undefined;
		} finally {
			setIsCreatingModelState(false);
		}
	}, [sessionApi, getScreenshot, notifications]);

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

			setIsImportingModelState(true);
			try {
				await sessionApi.customizeWithModelState(trimmedId);

				// Update parameter values in the store to reflect the new model state
				const parameterStores = getParameters(namespace);
				Object.keys(parameterStores).forEach((paramId) => {
					const store = parameterStores[paramId];
					const sessionParam = sessionApi.parameters[paramId];
					if (sessionParam && store) {
						const {actions} = store.getState();
						// Update both UI and execution values to match the session
						actions.setUiAndExecValue(sessionParam.value);
					}
				});

				notifications.success({
					message: "Model state imported successfully",
				});

				return true;
			} catch (error) {
				console.error("Error importing model state:", error);
				notifications.error({
					message: "Failed to import model state",
				});
				return false;
			} finally {
				setIsImportingModelState(false);
			}
		},
		[sessionApi, notifications, getParameters, namespace],
	);

	// Check for modelStateId query parameter on mount and apply it
	useEffect(() => {
		if (!sessionApi) return;

		const url = new URL(window.location.href);
		const modelStateId = url.searchParams.get("modelStateId");

		if (modelStateId) {
			importModelState(modelStateId);
		}
	}, [sessionApi, importModelState]);

	const sessionReady = Boolean(sessionApi);
	const isLoading = isCreatingModelState || isImportingModelState;

	return {
		createModelState,
		importModelState,
		sessionReady,
		isLoading,
		isCreatingModelState,
		isImportingModelState,
	};
}
