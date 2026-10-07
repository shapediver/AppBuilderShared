import {useViewportId} from "@AppBuilderLib/entities/viewport/model/useViewportId";
import type {ToolbarCommandItem} from "@AppBuilderLib/features/appbuilder/config/toolbarRenderTypes";
import {useShapeDiverStoreToolbars} from "@AppBuilderLib/features/appbuilder/model/useShapeDiverStoreToolbars";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {getEnvironmentIdentifier} from "@AppBuilderLib/shared/lib/platform/environment";
import {useThemeOverrideStore} from "@AppBuilderLib/shared/model/useThemeOverrideStore";
import {useProps} from "@mantine/core";
import {useCallback, useEffect, useRef, useState} from "react";
import type {
	AppBuilderAgentOverlayProps,
	UseAppBuilderAgentHostProps,
} from "../config/appBuilderAgentHost";
import {AGENT_THEME_REQUEST, postAgentTheme} from "../lib/agentThemeChannel";
import {
	hasPlacedHostedAgentWidget,
	placedHostedAgentId,
	warnDuplicateHostedAgentWidgets,
} from "../lib/hasPlacedHostedAgentWidget";
import {openAgentWindow} from "../lib/openAgentWindow";
import {resolveAgentUi} from "../lib/resolveAgentUi";
import {resolveAgentUrl} from "../lib/resolveAgentUrl";
import {useAgentToolTransports} from "./useAgentToolTransports";
import {useHostedAgentFrameStore} from "./useHostedAgentFrameStore";

/**
 * Hosts AppBuilderAgent on an App Builder page: toolbar button, iframe or
 * window, and ToolsApi. Not the LangChain agent itself.
 */
export function useAppBuilderAgentHost(
	props: UseAppBuilderAgentHostProps,
): AppBuilderAgentOverlayProps {
	const {namespace, appBuilderData, appBuilderParseSettled, sessionInfo} =
		props;
	const {viewportId} = useViewportId();
	const themeProps = useProps("AgentUi", {mode: "iframe" as const}, {});
	const {mode, showThreadHistory} = resolveAgentUi(themeProps);

	const resolvedAgentUrl = resolveAgentUrl(
		new URLSearchParams(window.location.search).get(QUERYPARAM_AGENTURL),
		getEnvironmentIdentifier(),
	);
	const iframeWindow = useHostedAgentFrameStore((state) => state.frame);
	const [popupWindow, setPopupWindow] = useState<Window | null>(null);
	const agentWindow = mode === "window" ? popupWindow : iframeWindow;
	const placedHostedAgent = hasPlacedHostedAgentWidget(appBuilderData);
	const agentId = placedHostedAgentId(appBuilderData);
	const themeOverrides = useThemeOverrideStore(
		(state) => state.themeOverride,
	);
	const [panelMounted, setPanelMounted] = useState(false);
	const [panelVisible, setPanelVisible] = useState(false);

	const {snapshotComplete, agentConfig, peerConnected} =
		useAgentToolTransports({
			namespace,
			appBuilderData,
			appBuilderParseSettled,
			agentWindow,
			sessionInfo,
			showThreadHistory,
			agentId,
		});
	const agentWindowRef = useRef(agentWindow);
	agentWindowRef.current = agentWindow;
	const peerConnectedRef = useRef(peerConnected);
	peerConnectedRef.current = peerConnected;

	const agentUrl =
		snapshotComplete && agentConfig ? resolvedAgentUrl : undefined;
	const agentUrlRef = useRef(agentUrl);
	agentUrlRef.current = agentUrl;
	const name = agentConfig?.name?.trim();
	const label = name ? name : "Agent";

	const openWindow = useCallback(() => {
		if (!agentUrl) {
			return;
		}
		const existing = agentWindowRef.current;
		if (existing && !existing.closed && peerConnectedRef.current) {
			try {
				existing.focus();
				return;
			} catch {
				// The window is still open but cannot be focused. Open it again.
			}
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
		setPopupWindow(null);
		window.setTimeout(() => setPopupWindow(opened), 0);
	}, [agentUrl]);

	const panelMountedRef = useRef(false);
	const panelVisibleRef = useRef(false);
	const modeRef = useRef(mode);
	modeRef.current = mode;
	const openWindowRef = useRef(openWindow);
	openWindowRef.current = openWindow;

	const onToggleAgent = useCallback(() => {
		if (!agentUrlRef.current) {
			return;
		}
		if (modeRef.current === "window") {
			openWindowRef.current();
			return;
		}
		if (!panelMountedRef.current) {
			panelMountedRef.current = true;
			panelVisibleRef.current = true;
			setPanelMounted(true);
			setPanelVisible(true);
			return;
		}
		const nextVisible = !panelVisibleRef.current;
		panelVisibleRef.current = nextVisible;
		setPanelVisible(nextVisible);
	}, []);

	const appliedModeRef = useRef(mode);
	useEffect(() => {
		warnDuplicateHostedAgentWidgets(appBuilderData);
	}, [appBuilderData]);

	useEffect(() => {
		if (appliedModeRef.current === mode) {
			return;
		}
		appliedModeRef.current = mode;
		panelMountedRef.current = false;
		panelVisibleRef.current = false;
		setPanelMounted(false);
		setPanelVisible(false);
		setPopupWindow(null);
	}, [mode]);

	useEffect(() => {
		const id = viewportId ? `agentUi-${viewportId}` : "agentUi";
		const {setDefaultToolbar, removeDefaultToolbar} =
			useShapeDiverStoreToolbars.getState();
		if (placedHostedAgent || (snapshotComplete && !agentConfig)) {
			removeDefaultToolbar(id);
			return;
		}
		const command: ToolbarCommandItem = {
			id: "open-agent",
			type: "command",
			label,
			tooltip: label,
			icon: "tabler:message-chatbot",
			disabled: !agentUrl,
			props: {
				allowDuringExecution: true,
				execute: onToggleAgent,
			},
		};
		setDefaultToolbar({
			id,
			source: "default",
			viewportId,
			side: "bottom",
			align: "end",
			order: 0,
			visibility: "always",
			ariaLabel: label,
			groups: [[command]],
		});
		return () => {
			removeDefaultToolbar(id);
		};
	}, [
		agentConfig,
		agentUrl,
		label,
		onToggleAgent,
		placedHostedAgent,
		snapshotComplete,
		viewportId,
	]);

	useEffect(() => {
		if (!agentWindow || !agentUrl) {
			return;
		}
		const send = () =>
			postAgentTheme(agentWindow, agentUrl, themeOverrides);
		send();
		const onRequest = (event: MessageEvent) => {
			if (event.source !== agentWindow) {
				return;
			}
			if (event.data?.type !== AGENT_THEME_REQUEST) {
				return;
			}
			send();
		};
		window.addEventListener("message", onRequest);
		return () => window.removeEventListener("message", onRequest);
	}, [agentUrl, agentWindow, themeOverrides]);

	return {
		agentUrl,
		mode,
		panelMounted: placedHostedAgent ? false : panelMounted,
		panelVisible: placedHostedAgent ? false : panelVisible,
	};
}
