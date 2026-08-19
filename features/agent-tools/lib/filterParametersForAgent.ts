import type {IShapeDiverParameter} from "@AppBuilderLib/entities/parameter/config/parameter";
import type {ListParameterDefinitionsToolSettings} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import type {UiParameterRef} from "./collectUiParameterRefs";
import {findParameterByName} from "./findParameterByName";

export type NamespacedParameter = {
	namespace: string;
	parameter: IShapeDiverParameter<unknown>;
};

function resolveRef(
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

function isUiVisible(
	item: NamespacedParameter,
	uiRefs: UiParameterRef[],
	controllerNamespace: string,
): boolean {
	return uiRefs.some(
		(ref) => resolveRef([item], ref, controllerNamespace) !== undefined,
	);
}

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
			const match = resolveRef(parameters, ref, controllerNamespace);
			if (match) {
				resolved.push(match);
			}
		}
		return resolved;
	}

	const allowedNamespaces =
		settings.filter?.sessionIds ?? [controllerNamespace];
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
			!isUiVisible(item, uiRefs, controllerNamespace)
		) {
			return false;
		}
		return true;
	});
}
