import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {useImportModelState} from "@AppBuilderLib/features/model-state/model/useImportModelState";
import {useCustomTheme} from "@AppBuilderLib/shared/ui/theme/useCustomTheme";
import {useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {registerWebMcpTools} from "../adapters/webmcp/registerWebMcpTools";
import {buildWebMcpDeps} from "../adapters/webmcp/webmcpDeps";
import {
	getModelContext,
	getWebMcpEnvironment,
	isWebMcpAvailable,
} from "../lib/webmcpAvailability";
import {registerResolvedTools} from "./registerResolvedTools";
import type {
	UseWebMcpToolsProps,
	UseWebMcpToolsResult,
} from "./useWebMcpTools.types";

export function useWebMcpTools(
	props: UseWebMcpToolsProps,
): UseWebMcpToolsResult {
	const {
		namespace,
		enabled = isWebMcpAvailable(),
		resolvedTools,
		toolHandlers,
		snapshotComplete,
		disabledTools,
	} = props;
	const [registered, setRegistered] = useState(false);
	const environment = getWebMcpEnvironment();
	const ready = registered && environment.ready;

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const {getParameters, batchParameterValueUpdate} =
		useShapeDiverStoreParameters(
			useShallow((state) => ({
				getParameters: state.getParameters,
				batchParameterValueUpdate: state.batchParameterValueUpdate,
			})),
		);

	const {createModelState} = useCreateModelState({
		namespace: namespace ?? "",
	});
	const {importModelState} = useImportModelState({
		namespace: namespace ?? "",
	});
	const {theme} = useCustomTheme();
	const namespaceRef = useRef<string>(namespace ?? "");
	namespaceRef.current = namespace ?? "";

	const getParametersRef = useRef(getParameters);
	getParametersRef.current = getParameters;

	const batchParameterValueUpdateRef = useRef(batchParameterValueUpdate);
	batchParameterValueUpdateRef.current = batchParameterValueUpdate;

	const createModelStateRef = useRef(createModelState);
	createModelStateRef.current = createModelState;

	const importModelStateRef = useRef(importModelState);
	importModelStateRef.current = importModelState;

	const componentSettingsRef = useRef<Record<string, any> | undefined>(
		undefined,
	);
	componentSettingsRef.current = (
		theme as any
	)?.components?.ParameterSelectComponent?.defaultProps?.componentSettings;

	const disabledToolsRef = useRef<string[] | undefined>(disabledTools);
	disabledToolsRef.current = disabledTools;
	const disabledKey = (disabledTools ?? []).slice().sort().join(",");

	const sessionReady = !!namespace && !!sessions[namespace];
	const paramsPopulated =
		!!namespace && Object.keys(getParameters(namespace)).length > 0;

	const resolvedToolsRef = useRef(resolvedTools);
	resolvedToolsRef.current = resolvedTools;
	const toolHandlersRef = useRef(toolHandlers);
	toolHandlersRef.current = toolHandlers;

	useEffect(() => {
		if (!enabled || !isWebMcpAvailable()) {
			setRegistered(false);
			return;
		}

		if (!sessionReady || !paramsPopulated || !snapshotComplete) {
			setRegistered(false);
			return;
		}

		const controller = new AbortController();
		let cancelled = false;

		const refs = {
			namespaceRef,
			getParametersRef,
			batchParameterValueUpdateRef,
			createModelStateRef,
			importModelStateRef,
			componentSettingsRef,
			listParameterNamespaces: () =>
				Object.keys(
					useShapeDiverStoreParameters.getState().parameterStores,
				),
		};

		const registerTools = async () => {
			const modelContext = getModelContext();

			try {
				await registerResolvedTools(
					modelContext,
					resolvedToolsRef.current,
					toolHandlersRef.current,
					controller.signal,
				);

				const skipped = new Set([
					...resolvedToolsRef.current.map((tool) => tool.name),
					...(disabledToolsRef.current ?? []),
				]);
				await registerWebMcpTools(
					modelContext,
					() => buildWebMcpDeps(refs),
					controller.signal,
					skipped,
				);

				if (!cancelled) {
					setRegistered(true);
				}
			} catch {
				if (!cancelled) {
					setRegistered(false);
				}
			}
		};

		void registerTools();

		return () => {
			cancelled = true;
			controller.abort();
			setRegistered(false);
		};
	}, [
		enabled,
		namespace,
		sessionReady,
		paramsPopulated,
		snapshotComplete,
		disabledKey,
	]);

	const environmentSnapshot = {
		modelContextAvailable: environment.modelContextAvailable,
		crossOriginIsolated: environment.crossOriginIsolated,
	};

	if (!enabled || !isWebMcpAvailable()) {
		return {
			registered: false,
			ready: false,
			environment: environmentSnapshot,
		};
	}

	return {
		registered,
		ready,
		environment: environmentSnapshot,
	};
}
