import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import {
	filterAndValidateModelStateParameters,
	generateParameterFeedback,
} from "@AppBuilderLib/entities/parameter/lib/parametersFilter";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderLib/shared/config/queryparams";
import {exceptionWrapperAsync} from "@AppBuilderLib/shared/lib/exceptionWrapper";
import {applyModelStateToUrl} from "@AppBuilderLib/shared/lib/modifyUrl";
import type {ISessionApi} from "@shapediver/viewer.session";
import {
	IImportModelStateData,
	IImportModelStateResult,
} from "../config/importModelState";
import {computeAppliedParameterIds} from "./computeAppliedParameterIds";

export type ImportModelStateNotificationType =
	| "error"
	| "success"
	| "info"
	| "warning";

export interface ImportModelStateNotification {
	type: ImportModelStateNotificationType;
	title?: string;
	message: string;
}

export interface ImportModelStateCoreArgs {
	sessionApi: ISessionApi | undefined;
	namespace: string;
	getParameterStates: (namespace: string) => IShapeDiverParameter<unknown>[];
	batchParameterValueUpdate: (
		updates: Record<string, Record<string, unknown>>,
	) => Promise<void>;
	clearUnsavedChanges: () => void;
	props: IImportModelStateData;
	onNotification?: (n: ImportModelStateNotification) => void;
	onLoadingChange?: (loading: boolean) => void;
	onError?: (e: Error) => void;
}

/**
 * Pure import-model-state logic shared by the React hook and hook-free ports.
 * Optional callbacks cover UI side-effects (notifications, loading, error reporting).
 */
export async function importModelStateCore(
	args: ImportModelStateCoreArgs,
): Promise<IImportModelStateResult> {
	const {
		sessionApi,
		namespace,
		getParameterStates,
		batchParameterValueUpdate,
		clearUnsavedChanges,
		props,
		onNotification,
		onLoadingChange,
		onError,
	} = args;

	let {modelStateId} = props;
	// sanitize input
	modelStateId = modelStateId.trim();
	if (modelStateId.startsWith("http")) {
		const url = new URL(modelStateId);
		modelStateId = url.searchParams.get(QUERYPARAM_MODELSTATEID) || "";
	}
	if (!modelStateId) {
		// Notification copy says "enter"; return message says "provide" — match hook.
		onNotification?.({
			type: "error",
			message: `Please enter a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
		});
		return {
			success: false,
			message: `Please provide a valid model state ID or a URL including a '${QUERYPARAM_MODELSTATEID}' parameter`,
		};
	}

	if (!sessionApi) {
		return {
			success: false,
			message: `Session "${namespace}" is not available`,
		};
	}

	onLoadingChange?.(true);
	const response = await exceptionWrapperAsync(
		() => sessionApi.getModelState(modelStateId),
		() => onLoadingChange?.(false),
	);

	if (response.error) {
		onError?.(response.error);
		onNotification?.({
			type: "error",
			title: "Failed to fetch model state",
			message: response.error.message || "An unknown error occurred",
		});
		return {
			success: false,
			message: `Failed to fetch model state: ${
				response.error.message || "An unknown error occurred"
			}`,
		};
	}

	const parameters = response.data.modelState?.parameters;

	if (!parameters) {
		onNotification?.({
			type: "error",
			message: "Model state does not contain parameter data",
		});
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
		onNotification?.({
			type: feedback.type,
			message: feedback.message,
		});
		return {
			success: false,
			message: feedback.message,
			invalidParameters: validationResult.invalidParameters,
		};
	}

	const beforeValues = new Map(
		getParameterStates(namespace).map((p) => [
			p.definition.id,
			p.state.execValue,
		]),
	);

	await batchParameterValueUpdate({
		[namespace]: validationResult.validParameters,
	});

	const appliedParameterIds = computeAppliedParameterIds(
		beforeValues,
		getParameterStates(namespace),
	);

	// importing a model state reverts the unsaved changes flag
	clearUnsavedChanges();

	// set as modelStateId in the URL
	applyModelStateToUrl(modelStateId, true);

	// Provide user feedback
	const feedback = generateParameterFeedback(
		validationResult,
		`Model state ${modelStateId} imported successfully`,
	);

	onNotification?.({
		type: feedback.type,
		message: feedback.message,
	});

	// Loading already cleared by exceptionWrapperAsync's finally (runs on success too).

	return {
		success: true,
		data: response.data,
		appliedParameterIds,
		...(validationResult.skippedParameters.length > 0
			? {
					invalidParameters: validationResult.invalidParameters,
				}
			: {}),
	};
}
