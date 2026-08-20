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
	resolved: ResolvedGenericTool[];
	handlers: IToolsApiHandlerMap;
	snapshotComplete: boolean;
};

export function useToolsApiConnector(
	props: UseToolsApiConnectorProps,
): void {
	const {
		window: peerWindow,
		resolved,
		handlers,
		snapshotComplete,
	} = props;

	const resolvedRef = useRef(resolved);
	resolvedRef.current = resolved;
	const handlersRef = useRef(handlers);
	handlersRef.current = handlers;

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
					resolvedRef.current,
					handlersRef.current,
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
