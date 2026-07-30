import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {ErrorReportingContext} from "@AppBuilderLib/shared/lib/ErrorReportingContext";
import {useCallback, useContext, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	IImportModelStateData,
	IImportModelStateResult,
} from "../config/importModelState";
import {importModelStateCore} from "../lib/importModelStateCore";

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

	const {batchParameterValueUpdate, clearUnsavedChanges} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				batchParameterValueUpdate: state.batchParameterValueUpdate,
				clearUnsavedChanges: state.clearUnsavedChanges,
			})),
		);

	/**
	 * Import a model state by ID
	 */
	const importModelState = useCallback(
		async (
			props: IImportModelStateData,
		): Promise<IImportModelStateResult> => {
			return importModelStateCore({
				sessionApi,
				namespace,
				getParameterStates,
				batchParameterValueUpdate,
				clearUnsavedChanges,
				props,
				onNotification: (n) =>
					notifications[n.type]({
						title: n.title,
						message: n.message,
					}),
				onLoadingChange: setIsLoading,
				onError: (e) => errorReporting.captureException(e),
			});
		},
		[sessionApi, namespace, clearUnsavedChanges],
	);

	return {
		importModelState,
		isLoading,
	};
}
