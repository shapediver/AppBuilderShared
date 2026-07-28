import {
	filterAndValidateModelStateParameters,
	generateParameterFeedback,
} from "@AppBuilderLib/entities/parameter/lib/parametersFilter";
import {getParameterStates} from "@AppBuilderLib/entities/parameter/lib/parameterStates";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import type {
	IImportModelStateData,
	IImportModelStateResult,
} from "@AppBuilderLib/features/model-state/config/importModelState";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderLib/shared/config/queryparams";
import {exceptionWrapperAsync} from "@AppBuilderLib/shared/lib/exceptionWrapper";
import {applyModelStateToUrl} from "@AppBuilderLib/shared/lib/modifyUrl";

export async function importModelStateFromStores(
	namespace: string,
	props: IImportModelStateData,
): Promise<IImportModelStateResult> {
	let {modelStateId} = props;
	modelStateId = modelStateId.trim();
	if (modelStateId.startsWith("http")) {
		const url = new URL(modelStateId);
		modelStateId = url.searchParams.get(QUERYPARAM_MODELSTATEID) || "";
	}
	if (!modelStateId) {
		return {
			success: false,
			message: `Please provide a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
		};
	}

	const sessionApi = useShapeDiverStoreSession.getState().sessions[namespace];
	if (!sessionApi) {
		return {
			success: false,
			message: `Session "${namespace}" is not available`,
		};
	}

	const {batchParameterValueUpdate, clearUnsavedChanges} =
		useShapeDiverStoreParameters.getState();

	const response = await exceptionWrapperAsync(() =>
		sessionApi.getModelState(modelStateId),
	);

	if (response.error) {
		return {
			success: false,
			message: `Failed to fetch model state: ${
				response.error.message || "An unknown error occurred"
			}`,
		};
	}

	const parameters = response.data.modelState?.parameters;
	if (!parameters) {
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
		return {
			success: false,
			message: feedback.message,
			invalidParameters: validationResult.invalidParameters,
		};
	}

	await batchParameterValueUpdate({
		[namespace]: validationResult.validParameters,
	});
	clearUnsavedChanges();
	applyModelStateToUrl(modelStateId, true);

	return {
		success: true,
		data: response.data,
		...(validationResult.skippedParameters.length > 0
			? {invalidParameters: validationResult.invalidParameters}
			: {}),
	};
}
