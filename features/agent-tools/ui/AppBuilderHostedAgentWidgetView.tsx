import type {IAppBuilderWidgetPropsHostedAgent} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {QUERYPARAM_AGENTURL} from "@AppBuilderLib/shared/config/queryparams";
import {getEnvironmentIdentifier} from "@AppBuilderLib/shared/lib/platform/environment";
import AppBuilderIframeWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderIframeWidgetComponent";
import {useCallback, useRef} from "react";
import {resolveAgentUrl} from "../lib/resolveAgentUrl";
import {useHostedAgentFrameStore} from "../model/useHostedAgentFrameStore";

const DEFAULT_TITLE = "ShapeDiver agent";

/**
 * Hosted AppBuilderAgent iframe. Resolves its own URL; no `url` prop.
 * Registers the frame window for ToolsApi.
 */
export default function AppBuilderHostedAgentWidgetView({
	title,
	height,
}: IAppBuilderWidgetPropsHostedAgent) {
	const url = resolveAgentUrl(
		new URLSearchParams(window.location.search).get(QUERYPARAM_AGENTURL),
		getEnvironmentIdentifier(),
	);
	const registeredRef = useRef<Window | null>(null);
	const onLoad = useCallback((frame: Window | null) => {
		if (frame) {
			registeredRef.current = frame;
			useHostedAgentFrameStore.getState().setFrame(frame);
			return;
		}
		const previous = registeredRef.current;
		registeredRef.current = null;
		useHostedAgentFrameStore.getState().clearFrame(previous);
	}, []);

	if (!url) {
		return null;
	}

	return (
		<AppBuilderIframeWidgetComponent
			url={url}
			title={title?.trim() || DEFAULT_TITLE}
			height={height}
			onLoad={onLoad}
		/>
	);
}
