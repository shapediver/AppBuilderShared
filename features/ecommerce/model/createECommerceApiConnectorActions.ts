import {getOutputContent} from "@AppBuilderLib/entities/parameter/lib/getOutputContent";
import {resetParameterValues} from "@AppBuilderLib/entities/parameter/lib/parameterImportExport";
import {
	redoParameterHistory,
	undoParameterHistory,
} from "@AppBuilderLib/entities/parameter/lib/undoRedoParameters";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {resolveViewportIdFromStore} from "@AppBuilderLib/entities/viewport/lib/resolveViewportIdFromStore";
import type {IAppBuilderActionDefinition} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	isAddToCartAction,
	isCameraAction,
	isCreateModelStateAction,
	isExecuteActionsAction,
	isImportModelStateAction,
	isRedoAction,
	isResetParameterValuesAction,
	isSoundAction,
	isUndoAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {findAppBuilderActionRegistration} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import type {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {defaultAppBuilderActionRuns} from "@AppBuilderLib/features/appbuilder/model/appBuilderActionCatalog";
import {addToCartFromStores} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionAddToCart";
import {createModelStateFromStores} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionCreateModelState";
import {runAppBuilderActionSound} from "@AppBuilderLib/features/appbuilder/model/runAppBuilderActionSound";
import {waitForAppBuilderSessionIdle} from "@AppBuilderLib/features/appbuilder/model/waitForAppBuilderSessionIdle";
import type {IImportModelStateData} from "@AppBuilderLib/features/model-state/config/importModelState";
import {importModelStateFromStore} from "@AppBuilderLib/features/model-state/lib/importModelStateFromStore";
import type {
	IECommerceApiConnectorActions,
	IGetOutputData,
	IGetOutputReply,
	ITriggerActionData,
	ITriggerActionReply,
	IUpdateParameterValuesData,
	IUpdateParameterValuesReply,
} from "../config/ecommerceapi";
import {
	validateCreateModelStateData,
	validateGetOutputData,
	validateImportModelStateData,
	validateTriggerActionData,
	validateUpdateParameterValuesData,
} from "../config/ecommerceapitypecheck";

function invalidDataError(action: string, error: unknown): Error {
	return new Error(`Invalid data for ${action}`, {cause: error});
}

function failureReply(e: unknown): ITriggerActionReply {
	return {
		success: false,
		message: e instanceof Error ? e.message : String(e),
	};
}

/**
 * Connector actions backed by Zustand stores. No React hooks.
 * Does not import agent-tools. Host-specific actions (camera) come from
 * `componentContext.actions` via {@link useECommerceApiConnectorActions}.
 */
export function createECommerceApiConnectorActions(
	namespace: string,
	hostActions?: IComponentContext["actions"],
): IECommerceApiConnectorActions {
	const updateParameterValues = async (
		data: IUpdateParameterValuesData,
	): Promise<IUpdateParameterValuesReply> => {
		const result = validateUpdateParameterValuesData(data);
		if (!result.success) {
			throw invalidDataError("updateParameterValues", result.error);
		}
		await useShapeDiverStoreParameters
			.getState()
			.batchParameterValueUpdate(
				data.state,
				data.skipHistory,
				data.skipUrlUpdate,
			);
		return {};
	};

	const createModelState: IECommerceApiConnectorActions["createModelState"] =
		async (data_) => {
			const data = data_ || {};
			const result = validateCreateModelStateData(data);
			if (!result.success) {
				throw invalidDataError("createModelState", result.error);
			}
			return createModelStateFromStores(
				namespace,
				resolveViewportIdFromStore(),
				data,
			);
		};

	const importModelState: IECommerceApiConnectorActions["importModelState"] =
		async (data) => {
			const result = validateImportModelStateData(data);
			if (!result.success) {
				throw invalidDataError("importModelState", result.error);
			}
			return importModelStateFromStore(namespace, data);
		};

	const dispatchAction = async (
		definition: IAppBuilderActionDefinition,
	): Promise<ITriggerActionReply> => {
		const viewportId = resolveViewportIdFromStore(
			isCameraAction(definition)
				? definition.props.viewportId
				: undefined,
		);
		if (isExecuteActionsAction(definition)) {
			const mode = definition.props.mode ?? "parallel";
			if (mode === "sequential") {
				for (const nested of definition.props.actions) {
					const result = await dispatchAction(nested);
					if (!result.success) return result;
					await waitForAppBuilderSessionIdle();
				}
				return {success: true};
			}
			const results = await Promise.allSettled(
				definition.props.actions.map((nested) =>
					dispatchAction(nested),
				),
			);
			await waitForAppBuilderSessionIdle();
			for (const result of results) {
				if (result.status === "rejected") {
					return failureReply(result.reason);
				}
				if (!result.value.success) {
					return result.value;
				}
			}
			return {success: true};
		}
		if (isCreateModelStateAction(definition)) {
			const result = await createModelStateFromStores(
				namespace,
				viewportId,
				definition.props,
			);
			if (!result.modelStateId) {
				return {
					success: false,
					message: "Failed to create model state.",
				};
			}
			return {success: true};
		}
		if (isImportModelStateAction(definition)) {
			const result = await importModelStateFromStore(
				namespace,
				definition.props as IImportModelStateData,
			);
			return result.success
				? {success: true}
				: {success: false, message: result.message};
		}
		if (isResetParameterValuesAction(definition)) {
			await resetParameterValues(namespace, {notify: false});
			return {success: true};
		}
		if (isUndoAction(definition)) {
			return undoParameterHistory(namespace);
		}
		if (isRedoAction(definition)) {
			return redoParameterHistory(namespace);
		}
		if (isAddToCartAction(definition)) {
			await addToCartFromStores(definition.props, {
				namespace,
				viewportId,
			});
			return {success: true};
		}
		if (isSoundAction(definition)) {
			await runAppBuilderActionSound(definition.props);
			return {success: true};
		}
		const entry = findAppBuilderActionRegistration(
			definition,
			defaultAppBuilderActionRuns,
			hostActions,
		);
		if (!entry?.run) {
			return {
				success: false,
				message: `No runner for action type "${definition.type}".`,
			};
		}
		await entry.run(definition, {
			namespace,
			viewportId,
			hostActions,
			strict: true,
		});
		return {success: true};
	};

	const triggerAction = async (
		data: ITriggerActionData,
	): Promise<ITriggerActionReply> => {
		const parsed = validateTriggerActionData(data);
		if (!parsed.success) {
			throw invalidDataError("triggerAction", parsed.error);
		}
		try {
			return await dispatchAction(
				parsed.data as IAppBuilderActionDefinition,
			);
		} catch (e) {
			return failureReply(e);
		}
	};

	const getOutput = async (
		data: IGetOutputData,
	): Promise<IGetOutputReply> => {
		const parsed = validateGetOutputData(data);
		if (!parsed.success) {
			throw invalidDataError("getOutput", parsed.error);
		}
		return getOutputContent(
			parsed.data.namespace ?? namespace,
			parsed.data.output,
		);
	};

	return {
		updateParameterValues,
		createModelState,
		importModelState,
		triggerAction,
		getOutput,
	};
}
