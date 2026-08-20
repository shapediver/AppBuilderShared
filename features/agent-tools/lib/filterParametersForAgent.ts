import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {ListParameterDefinitionsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import type {UiParameterRef} from "./collectUiParameterRefs";
import {findParameterByName} from "./findParameterByName";

export type NamespacedParameter = {
	namespace: string;
	parameter: IShapeDiverParameter<unknown>;
};

/** Find a live parameter for an agent `{name, sessionId?}` (id, name, or displayname). */
function findParameterForAgentRef(
	parameters: NamespacedParameter[],
	ref: {name: string; sessionId?: string},
	controllerNamespace: string,
): NamespacedParameter | undefined {
	const namespace = ref.sessionId ?? controllerNamespace;
	const inNamespace = parameters.filter((p) => p.namespace === namespace);
	const found = findParameterByName(
		inNamespace.map((p) => p.parameter),
		ref.name,
	);
	if (!found) {
		return undefined;
	}
	return inNamespace.find((p) => p.parameter === found);
}

/** Same id/name/displayname rules as `findParameterByName`, for one namespaced item. */
function refMatchesItem(
	item: NamespacedParameter,
	ref: {name: string; sessionId?: string},
	controllerNamespace: string,
): boolean {
	const ns = ref.sessionId ?? controllerNamespace;
	if (item.namespace !== ns) return false;
	const d = item.parameter.definition;
	return (
		d.id === ref.name || d.name === ref.name || d.displayname === ref.name
	);
}

/** True when the parameter appears in App Builder UI refs (not CSS `hidden`). */
function isListedInUiRefs(
	item: NamespacedParameter,
	uiRefs: UiParameterRef[],
	controllerNamespace: string,
): boolean {
	return uiRefs.some((ref) => refMatchesItem(item, ref, controllerNamespace));
}

/**
 * Parameters exposed to list/get tools.
 * `settings.parameters` present (including `[]`) → those refs only; empty list is empty, not "all".
 * Omitted `parameters` → filter (`hidden` default exclude, `invisible` default include).
 * Missing `sessionId` on a ref → `controllerNamespace`.
 */
export function filterParametersForAgent(args: {
	parameters: NamespacedParameter[];
	controllerNamespace: string;
	settings: ListParameterDefinitionsToolSettings;
	uiRefs: UiParameterRef[];
}): NamespacedParameter[] {
	const {parameters, controllerNamespace, settings, uiRefs} = args;

	if (settings.parameters) {
		const resolved: NamespacedParameter[] = [];
		for (const ref of settings.parameters) {
			const match = findParameterForAgentRef(
				parameters,
				ref,
				controllerNamespace,
			);
			if (match) {
				resolved.push(match);
			}
		}
		return resolved;
	}

	const allowedNamespaces = settings.filter?.sessionIds ?? [
		controllerNamespace,
	];
	const hiddenMode = settings.filter?.hidden ?? "exclude";
	const invisibleMode = settings.filter?.invisible ?? "include";

	return parameters.filter((item) => {
		if (!allowedNamespaces.includes(item.namespace)) {
			return false;
		}
		if (
			hiddenMode === "exclude" &&
			item.parameter.definition.hidden === true
		) {
			return false;
		}
		if (
			invisibleMode === "exclude" &&
			!isListedInUiRefs(item, uiRefs, controllerNamespace)
		) {
			return false;
		}
		return true;
	});
}
