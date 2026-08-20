import {
	isAddToCartAction,
	isCameraAction,
	isCreateModelStateAction,
	isImportModelStateAction,
	isRedoAction,
	isResetParameterValuesAction,
	isSetCameraAction,
	isSetParameterValueAction,
	isSetParameterValuesAction,
	isSoundAction,
	isUndoAction,
	type IAppBuilderActionDefinition,
	type IAppBuilderActionPropsCamera,
	type IAppBuilderControlActionRef,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {RunActionControlResult} from "../config/triggerActionControl";
import {formatToolInputError} from "../lib/formatToolInputError";
import {applyParameterUpdates} from "../lib/resolveSetParameterUpdates";
import type {AgentToolsDeps} from "./agentToolsDeps";

function failureMessage(e: unknown): string {
	return formatToolInputError(e).errors[0].message;
}

function tupleToVec3(
	tuple: [number, number, number] | undefined,
): {x: number; y: number; z: number} | undefined {
	if (!tuple) {
		return undefined;
	}
	const [x, y, z] = tuple;
	return {x, y, z};
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

async function runCameraAction(
	definition: {type: "camera"; props: IAppBuilderActionPropsCamera},
	deps: AgentToolsDeps,
): Promise<RunActionControlResult> {
	if (!isSetCameraAction(definition.props)) {
		return {
			success: false,
			message: "Camera action subtype not supported",
		};
	}
	const position = tupleToVec3(definition.props.props.position);
	const target = tupleToVec3(definition.props.props.target);
	if (!position || !target) {
		return {
			success: false,
			message: "Camera position and target are required.",
		};
	}
	return await deps.setCamera({
		viewportId: deps.getViewportId(),
		position,
		target,
	});
}

/** Run an action control without mounting App Builder UI. Custom/source-only → "not supported". */
export async function runActionControl(
	action: IAppBuilderControlActionRef,
	deps: AgentToolsDeps,
): Promise<RunActionControlResult> {
	try {
		if (deps.isCustomComponentContextAction?.(action)) {
			return {success: false, message: "not supported"};
		}
		const definition = action.definition;
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
			return await runCameraAction(definition, deps);
		}
		if (isSoundAction(definition)) {
			if (!deps.playSound) {
				return {success: false, message: "not supported"};
			}
			return await deps.playSound(definition.props);
		}
		return {success: false, message: "not supported"};
	} catch (e) {
		return {success: false, message: failureMessage(e)};
	}
}
