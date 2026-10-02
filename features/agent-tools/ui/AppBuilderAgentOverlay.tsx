import type {AppBuilderAgentOverlayProps} from "../config/appBuilderAgentHost";
import AppBuilderAgentFrame from "./AppBuilderAgentFrame";
import classes from "./AppBuilderAgentOverlay.module.css";

export type {AppBuilderAgentOverlayProps};

/**
 * Floating agent iframe. The toolbar button lives in the viewport toolbar.
 * Hiding the slot keeps the iframe mounted so the next open does not reload.
 */
export default function AppBuilderAgentOverlay({
	agentUrl,
	mode,
	panelMounted,
	panelVisible,
	onPeerWindow,
}: AppBuilderAgentOverlayProps) {
	if (mode !== "iframe" || !panelMounted || !agentUrl) {
		return null;
	}

	return (
		<div
			className={classes.slot}
			style={{display: panelVisible ? "block" : "none"}}
		>
			<AppBuilderAgentFrame src={agentUrl} onPeerWindow={onPeerWindow} />
		</div>
	);
}
