import {useShapeDiverStoreParameters} from "@AppBuilderLib/entities/parameter/model/useShapeDiverStoreParameters";
import {useShapeDiverStoreSession} from "@AppBuilderLib/entities/session/model/useShapeDiverStoreSession";
import {resolveToolset} from "@AppBuilderLib/features/agent-tools/config/resolveToolset";
import {useAgentToolHandlers} from "@AppBuilderLib/features/agent-tools/model/useAgentToolHandlers";
import {useEffect, useRef, useState} from "react";
import {useShallow} from "zustand/react/shallow";
import {
	getModelContext,
	getWebMcpEnvironment,
	isWebMcpAvailable,
} from "../lib/webmcpAvailability";
import {registerResolvedTools} from "./registerResolvedTools";
import {takeAgentSnapshot} from "./takeAgentSnapshot";
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
		appBuilderData,
		appBuilderParseSettled = false,
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

	const agentRef = useRef(takeAgentSnapshot("unset", undefined));
	agentRef.current = takeAgentSnapshot(
		agentRef.current,
		appBuilderData,
		appBuilderParseSettled,
	);
	const snapshotComplete = agentRef.current !== "unset";

	const resolved = resolveToolset(
		agentRef.current === "unset" ? undefined : agentRef.current,
	);
	const handlers = useAgentToolHandlers({
		namespace: namespace ?? "",
		appBuilderData,
		resolved,
	});
	const resolvedRef = useRef(resolved);
	resolvedRef.current = resolved;
	const handlersRef = useRef(handlers);
	handlersRef.current = handlers;

	useEffect(() => {
		if (enabled === false || !isWebMcpAvailable()) {
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
					resolvedRef.current,
					handlersRef.current,
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

	if (enabled === false || !isWebMcpAvailable()) {
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
