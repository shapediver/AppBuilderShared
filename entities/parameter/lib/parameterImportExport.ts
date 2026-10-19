import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {getNotificationActions} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {
	exceptionWrapper,
	exceptionWrapperAsync,
} from "@AppBuilderLib/shared/lib/exceptionWrapper";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useShapeDiverStorePlatform} from "@AppBuilderLib/shared/model/useShapeDiverStorePlatform";
import {
	filterAndValidateParameters,
	generateParameterFeedback,
	isImportParameterArray,
} from "./parametersFilter";
import {resolveParameterExportValue} from "./resolveParameterExportValue";

/** Download current parameter values as JSON. */
export async function exportParameterValues(namespace: string): Promise<void> {
	const {clearUnsavedChanges} = useShapeDiverStoreParameters.getState();
	const model = useShapeDiverStorePlatform
		.getState()
		.getModelForSession(namespace);
	const notifications = getNotificationActions();
	const parameterArray = getParameterStates(namespace).map((param) => ({
		id: param.definition.id,
		value: resolveParameterExportValue({
			definitionType: param.definition.type,
			execValue: param.state.execValue,
			stringExecValue: () => param.state.stringExecValue(),
		}),
		name: param.definition.name,
	}));

	const jsonContent = JSON.stringify({
		...(model && {model_id: model.id}),
		parameters: parameterArray,
	});
	const blob = new Blob([jsonContent], {type: "application/json"});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `parameters_${model ? model.slug : namespace}_${new Date().toISOString().split("T")[0]}.json`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);

	notifications.success({
		message: "Parameter values exported successfully",
	});
	clearUnsavedChanges();
}

/** Open a file picker and apply imported parameter values. */
export function importParameterValues(namespace: string): Promise<void> {
	const {batchParameterValueUpdate, clearUnsavedChanges} =
		useShapeDiverStoreParameters.getState();
	const notifications = getNotificationActions();

	return new Promise<void>((resolve, reject) => {
		const fileInput = document.createElement("input");
		fileInput.type = "file";
		fileInput.accept = ".json";

		fileInput.onchange = async (event: Event) => {
			const target = event.target as HTMLInputElement;
			const file = target.files?.[0];

			if (!file) {
				const errorMessage = "No file selected";
				notifications.error({message: errorMessage});
				reject(new Error(errorMessage));
				return;
			}

			const response = await exceptionWrapperAsync<string>(() =>
				file.text(),
			);

			if (response.error) {
				Logger.error(response.error);
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
				Logger.error(importResult.error);
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
				notifications.error({message: errorMessage});
				reject(new Error(errorMessage));
				return;
			}

			if (!isImportParameterArray(importData.parameters)) {
				const errorMessage =
					"The schema of the parameters is not valid";
				notifications.error({message: errorMessage});
				reject(new Error(errorMessage));
				return;
			}

			const validationResult = filterAndValidateParameters(
				getParameterStates(namespace),
				importData.parameters,
			);

			if (!validationResult.hasValidParameters) {
				const feedback = generateParameterFeedback(validationResult);
				notifications[feedback.type]({message: feedback.message});
				reject(new Error(feedback.message));
				return;
			}

			await batchParameterValueUpdate({
				[namespace]: validationResult.validParameters,
			});
			clearUnsavedChanges();

			const feedback = generateParameterFeedback(
				validationResult,
				"Parameter values imported successfully",
			);
			notifications[feedback.type]({message: feedback.message});
			resolve();
		};

		fileInput.click();
	});
}

/** Reset parameters in the namespace to their default values. */
export async function resetParameterValues(
	namespace: string,
	options?: {notify?: boolean},
): Promise<void> {
	const {batchParameterValueUpdate} = useShapeDiverStoreParameters.getState();
	const defaultValues = getParameterStates(namespace).reduce(
		(acc, param) => {
			acc[param.definition.id] = param.definition.defval;
			return acc;
		},
		{} as Record<string, unknown>,
	);
	await batchParameterValueUpdate({[namespace]: defaultValues});
	if (options?.notify !== false) {
		getNotificationActions().success({
			message: "Parameters reset to default values",
		});
	}
}
