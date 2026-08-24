import type {
	IAppBuilder,
	IAppBuilderSettingsJson,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {isWebMcpAvailable} from "@AppBuilderLib/features/webmcp/lib/webmcpAvailability";
import {useWebMcpTools} from "@AppBuilderLib/features/webmcp/model/useWebMcpTools";
import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {useCallback, useState} from "react";
import {resolveAgentUrl} from "../lib/resolveAgentUrl";
import {useAgentToolRuntime} from "./useAgentToolRuntime";
import {useToolsApiConnector} from "./useToolsApiConnector";

export type UseAppBuilderAgentProps = {
	namespace?: string;
	appBuilderData?: IAppBuilder;
	appBuilderParseSettled?: boolean;
	settings?: Pick<IAppBuilderSettingsJson, "settings">;
};

export type AppBuilderAgentOverlayProps = {
	agentUrl?: string;
	agentOpen: boolean;
	snapshotComplete: boolean;
	onOpen: () => void;
	onPeerWindow: (peer: Window | null) => void;
};

export function useAppBuilderAgent(
	props: UseAppBuilderAgentProps,
): AppBuilderAgentOverlayProps {
	const {namespace, appBuilderData, appBuilderParseSettled, settings} =
		props;

	const agentUrl = resolveAgentUrl(
		new URLSearchParams(window.location.search).get(QUERYPARAM_AGENTURL),
		settings?.settings?.agentUrl,
	);
	const [agentWindow, setAgentWindow] = useState<Window | null>(null);
	const [agentOpen, setAgentOpen] = useState(false);
	const onPeerWindow = useCallback((peer: Window | null) => {
		setAgentWindow(peer);
	}, []);

	const {resolvedTools, toolHandlers, snapshotComplete} =
		useAgentToolRuntime({
			namespace,
			appBuilderData,
			appBuilderParseSettled,
		});

	useWebMcpTools({
		namespace,
		enabled: isWebMcpAvailable(),
		resolvedTools,
		toolHandlers,
		snapshotComplete,
	});

	useToolsApiConnector({
		window: agentWindow,
		resolvedTools,
		toolHandlers,
		snapshotComplete,
	});

	const onOpen = useCallback(() => {
		if (!agentUrl) {
			return;
		}
		setAgentOpen(true);
	}, [agentUrl]);

	return {
		agentUrl,
		agentOpen,
		snapshotComplete,
		onOpen,
		onPeerWindow,
	};
}
