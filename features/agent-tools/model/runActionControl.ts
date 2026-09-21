import {
	isAddToCartAction,
	isCameraAction,
	isCreateModelStateAction,
	isExecuteActionsAction,
	isImportModelStateAction,
	isRedoAction,
	isResetParameterValuesAction,
	isSetParameterValueAction,
	isSetParameterValuesAction,
	isSoundAction,
	isUndoAction,
	type IAppBuilderActionDefinition,
	type IAppBuilderControlActionRef,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {waitForAppBuilderSessionIdle} from "@AppBuilderLib/features/appbuilder/model/waitForAppBuilderSessionIdle";
import type {RunActionControlResult} from "../config/triggerActionControl";
import {formatToolInputError} from "../lib/formatToolInputError";
import {applyParameterUpdates} from "../lib/resolveSetParameterUpdates";
import type {AgentToolsDeps} from "./agentToolsDeps";

function failureMessage(e: unknown): string {
	return formatToolInputError(e).errors[0].message;
}

async function runSetParameterAction(
	definition: IAppBuilderActionDefinition,
	deps: AgentToolsDeps,
): Promise<RunActionControlResult> {
	const items = isSetParameterValuesAction(definition)
		? definition.props.parameterValues
		: isSetParameterValueAction(definition)
			? [definition.props]
			: [];
	if (
		items.some(
			(item) => item.source !== undefined && item.value === undefined,
		)
	) {
		return {success: false, message: "not supported"};
	}
	const updates = items.flatMap((item) =>
		item.value === undefined
			? []
			: [
					{
						name: item.parameter.name,
						sessionId: item.parameter.sessionId,
						value: item.value,
					},
				],
	);
	const result = await applyParameterUpdates(
		deps.controllerNamespace,
		deps.getLiveParameters,
		updates,
		deps.batchParameterValueUpdate,
	);
	if (result.errors.length > 0) {
		return {success: false, message: result.errors[0].message};
	}
	return {success: true};
}

/** Run an action control without mounting App Builder UI. Custom/source-only → "not supported". */
export async function runActionControl(
	action: IAppBuilderControlActionRef,
	deps: AgentToolsDeps,
): Promise<RunActionControlResult> {
	try {
		const definition = action.definition;
		if (isExecuteActionsAction(definition)) {
			const mode = definition.props.mode ?? "parallel";
			if (mode === "sequential") {
				for (const nested of definition.props.actions) {
					const result = await runActionControl(
						{definition: nested},
						deps,
					);
					if (!result.success) return result;
					await waitForAppBuilderSessionIdle();
				}
				return {success: true};
			}
			const results = await Promise.allSettled(
				definition.props.actions.map((nested) =>
					runActionControl({definition: nested}, deps),
				),
			);
			await waitForAppBuilderSessionIdle();
			for (const result of results) {
				if (result.status === "rejected") {
					return {
						success: false,
						message: failureMessage(result.reason),
					};
				}
				if (!result.value.success) return result.value;
			}
			return {success: true};
		}
		if (isCreateModelStateAction(definition)) {
			return await deps.createModelState(definition.props);
		}
		if (isImportModelStateAction(definition)) {
			return await deps.importModelState(definition.props);
		}
		if (
			isSetParameterValueAction(definition) ||
			isSetParameterValuesAction(definition)
		) {
			return await runSetParameterAction(definition, deps);
		}
		if (isUndoAction(definition)) {
			return await deps.undo();
		}
		if (isRedoAction(definition)) {
			return await deps.redo();
		}
		if (isResetParameterValuesAction(definition)) {
			return await deps.resetParameters(deps.controllerNamespace);
		}
		if (isAddToCartAction(definition)) {
			if (!deps.addToCart) {
				return {
					success: false,
					message: "addToCart is not available",
				};
			}
			return await deps.addToCart(definition.props);
		}
		if (isCameraAction(definition)) {
			if (!deps.runCameraAction) {
				return {success: false, message: "camera is not available"};
			}
			return await deps.runCameraAction(definition);
		}
		if (isSoundAction(definition)) {
			if (!deps.playSound) {
				return {success: false, message: "not supported"};
			}
			return await deps.playSound(definition.props);
		}
		if (deps.isCustomComponentContextAction?.(action)) {
			return {success: false, message: "not supported"};
		}
		return {success: false, message: "not supported"};
	} catch (e) {
		return {success: false, message: failureMessage(e)};
	}
}
