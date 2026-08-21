import {useEffect, useRef} from "react";
import {ToolsApiFactory} from "../api/toolsApi";
import type {ResolvedGenericTool} from "../config/resolveToolset";
import {
	TOOLS_API_NAME_AGENT,
	TOOLS_API_NAME_APP,
	TOOLS_API_TIMEOUT_MS,
	type IToolsApiConnector,
	type IToolsApiHandlerMap,
} from "../config/toolsApi";

export type UseToolsApiConnectorProps = {
	window?: Window | null;
	resolvedTools: ResolvedGenericTool[];
	toolHandlers: IToolsApiHandlerMap;
	snapshotComplete: boolean;
};

export function useToolsApiConnector(props: UseToolsApiConnectorProps): void {
	const {
		window: peerWindow,
		resolvedTools,
		toolHandlers,
		snapshotComplete,
	} = props;

	const resolvedToolsRef = useRef(resolvedTools);
	resolvedToolsRef.current = resolvedTools;
	const toolHandlersRef = useRef(toolHandlers);
	toolHandlersRef.current = toolHandlers;

	useEffect(() => {
		if (!peerWindow || !snapshotComplete) {
			return;
		}

		let effectAbandoned = false;
		let connector: IToolsApiConnector | undefined;

		void (async () => {
			try {
				connector = await ToolsApiFactory.getConnectorApi(
					peerWindow,
					resolvedToolsRef.current,
					toolHandlersRef.current,
					TOOLS_API_NAME_APP,
					TOOLS_API_NAME_AGENT,
					{timeout: TOOLS_API_TIMEOUT_MS},
				);
				void connector.peerIsReady.catch(() => {});
				if (effectAbandoned) {
					connector.cancel();
					return;
				}
			} catch {
				// getConnectorApi / transport failure — not a fake toolset
			}
		})();

		return () => {
			effectAbandoned = true;
			connector?.cancel();
		};
	}, [peerWindow, snapshotComplete]);
}
