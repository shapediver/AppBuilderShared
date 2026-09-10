import type {
	IParameterStore,
	IShapeDiverStoreParameters,
} from "@AppBuilderLib/entities/parameter/config/shapediverStoreParameters";
import type {IParameterResetValueSettings} from "@AppBuilderLib/entities/parameter/lib/parameterResetValue";
import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {useEffect, useMemo, useRef} from "react";
import {useShallow} from "zustand/react/shallow";
import type {IAppBuilder} from "../config/appbuilder";
import {
	collectParameterRefs,
	type CollectedParameterRef,
} from "../lib/collectParameterRefs";

interface Props {
	/** Default namespace for references without a session id. */
	namespace: string;
	/** The App Builder data, undefined while it is not available. */
	appBuilderData?: IAppBuilder;
}

interface ResetValueReference {
	name: string;
	sessionId?: string;
	/** The reset value defined by the reference, undefined if none is defined. */
	resetValue: unknown;
}

/**
 * The reset value defined by the overrides of a parameter reference.
 * null is treated like no reset value.
 */
const getOverrideResetValue = (ref: CollectedParameterRef): unknown => {
	const settings = ref.overrides?.settings as
		| IParameterResetValueSettings
		| undefined;
	const resetValue = settings?.resetValue;

	return resetValue === null ? undefined : resetValue;
};

/**
 * Resolve the parameter store of a reference like the widgets do: by id, name
 * or displayname within the namespace of the reference. References to custom
 * parameters carry the namespace of the custom parameters as session id
 * ("<session id>_appbuilder", see useAppBuilderCustomParameters).
 */
const resolveParameterStore = (
	state: IShapeDiverStoreParameters,
	namespace: string,
	ref: ResetValueReference,
): IParameterStore | undefined =>
	state.getParameter(ref.sessionId ?? namespace, ref.name);

/**
 * Register the reset values defined by the overrides of the parameter
 * references of the App Builder data with the parameter stores.
 *
 * The App Builder data is the source of truth for these registrations, not
 * the rendered parameter components: a hidden reference registers its reset
 * value like a visible one, so that the reset value applies independent of
 * the presentation (e.g. a parameter storing a model state, whose visibility
 * is controlled by another parameter).
 *
 * Rules:
 *  - A parameter is reset to the value defined by its first reference (in
 *    document order) which defines a reset value. Conflicting reset values of
 *    further references are ignored with a warning.
 *  - A parameter whose references define no reset value (anymore) has no
 *    registered reset value, e.g. a model which defines the reset value only
 *    for some computations.
 *  - A registration is removed once the parameter is not referenced anymore.
 *  - Registrations are kept while the App Builder data is unavailable.
 *
 * The parameter stores may be created after the App Builder data was parsed,
 * the registration is repeated once they exist.
 *
 * @param props
 */
export function useAppBuilderResetValueOverrides(props: Props) {
	const {namespace, appBuilderData} = props;

	// the references and their reset values, in document order
	const refs = useMemo<ResetValueReference[] | undefined>(
		() =>
			appBuilderData
				? collectParameterRefs(appBuilderData).map((ref) => ({
						name: ref.name,
						sessionId: ref.sessionId,
						resetValue: getOverrideResetValue(ref),
					}))
				: undefined,
		[appBuilderData],
	);

	// the parameter stores of the references (undefined while a store does not exist)
	const stores = useShapeDiverStoreParameters(
		useShallow((state) =>
			(refs ?? []).map((ref) =>
				resolveParameterStore(state, namespace, ref),
			),
		),
	);

	// the registrations done by this hook, store -> serialized reset value
	const registeredRef = useRef(
		new Map<IParameterStore, string | undefined>(),
	);

	useEffect(() => {
		// without App Builder data the registrations are kept
		if (!refs) return;

		// the reset value to register per parameter store
		const registrations = new Map<IParameterStore, unknown>();
		refs.forEach((ref, index) => {
			const store = stores[index];
			if (!store) return;
			const {resetValue} = ref;
			if (resetValue === undefined) {
				if (!registrations.has(store))
					registrations.set(store, undefined);
				return;
			}
			const current = registrations.get(store);
			if (current === undefined) {
				registrations.set(store, resetValue);
				return;
			}
			if (JSON.stringify(current) !== JSON.stringify(resetValue))
				Logger.warn(
					`Conflicting reset values defined by the references of parameter "${ref.name}", using the first one.`,
					current,
					resetValue,
				);
		});

		const registered = registeredRef.current;
		registrations.forEach((resetValue, store) => {
			// the serialized value avoids re-registering an unchanged reset value
			// parsed from a new response
			const serialized =
				resetValue === undefined
					? undefined
					: JSON.stringify(resetValue);
			if (registered.has(store) && registered.get(store) === serialized)
				return;
			store.getState().actions.setResetValue(resetValue);
			registered.set(store, serialized);
		});
		// parameters which are not referenced anymore
		Array.from(registered.keys()).forEach((store) => {
			if (registrations.has(store)) return;
			store.getState().actions.setResetValue(undefined);
			registered.delete(store);
		});
	}, [refs, stores]);
}
