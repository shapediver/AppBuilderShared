import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {useCallback, useState} from "react";
import type {
	AppBuilderAgentOverlayProps,
	UseAppBuilderAgentHostProps,
} from "../config/appBuilderAgentHost";
import {openAgentWindow} from "../lib/openAgentWindow";
import {readAgentUrlEnv} from "../lib/readAgentUrlEnv";
import {resolveAgentUrl} from "../lib/resolveAgentUrl";
import {useAgentToolTransports} from "./useAgentToolTransports";

/**
 * Hosts AppBuilderAgent on an App Builder page: tool transports + overlay state.
 * Not the LangChain agent itself.
 */
export function useAppBuilderAgentHost(
	props: UseAppBuilderAgentHostProps,
): AppBuilderAgentOverlayProps {
	const {namespace, appBuilderData, appBuilderParseSettled, settings} = props;

	const agentUrl = resolveAgentUrl(
		new URLSearchParams(window.location.search).get(QUERYPARAM_AGENTURL),
		settings?.settings?.agentUrl,
		readAgentUrlEnv(),
	);
	const [agentWindow, setAgentWindow] = useState<Window | null>(null);

	const {snapshotComplete} = useAgentToolTransports({
		namespace,
		appBuilderData,
		appBuilderParseSettled,
		agentWindow,
	});

	const onOpenAgent = useCallback(() => {
		if (!agentUrl) {
			return;
		}
		const opened = openAgentWindow(agentUrl);
		if (!opened) {
			useNotificationStore.getState().show({
				title: "Could not open agent window.",
				message:
					"The agent window is not connected. Close it if it is open, then try Open agent again.",
				color: "red",
			});
			return;
		}
		setAgentWindow(null);
		window.setTimeout(() => setAgentWindow(opened), 0);
	}, [agentUrl]);

	return {
		agentUrl,
		isAgentReady: snapshotComplete,
		onOpenAgent,
	};
}
