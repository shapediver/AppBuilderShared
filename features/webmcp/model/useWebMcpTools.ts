import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";
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
	} = props;
	const [registered, setRegistered] = useState(false);
	const environment = getWebMcpEnvironment();
	const ready = registered && environment.ready;

	const {sessions} = useShapeDiverStoreSession(
		useShallow((state) => ({
			sessions: state.sessions,
		})),
	);

	const {getParameters} = useShapeDiverStoreParameters(
		useShallow((state) => ({
			getParameters: state.getParameters,
		})),
	);

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

		const registerTools = async () => {
			const modelContext = getModelContext();

			try {
				await registerResolvedTools(
					modelContext,
					resolvedToolsRef.current,
					toolHandlersRef.current,
					controller.signal,
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
	}, [enabled, namespace, sessionReady, paramsPopulated, snapshotComplete]);

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
