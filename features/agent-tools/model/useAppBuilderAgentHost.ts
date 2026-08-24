import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {useCallback, useState} from "react";
import type {
	AppBuilderAgentOverlayProps,
	UseAppBuilderAgentHostProps,
} from "../config/appBuilderAgentHost";
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
	);
	const [agentWindow, setAgentWindow] = useState<Window | null>(null);
	const [isAgentOpen, setIsAgentOpen] = useState(false);
	const onAgentWindow = useCallback((nextWindow: Window | null) => {
		setAgentWindow(nextWindow);
	}, []);

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
		setIsAgentOpen(true);
	}, [agentUrl]);

	return {
		agentUrl,
		isAgentOpen,
		isAgentReady: snapshotComplete,
		onOpenAgent,
		onAgentWindow,
	};
}
