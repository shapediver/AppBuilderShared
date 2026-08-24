import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {OverlayPosition} from "@AppBuilderLib/shared/ui/overlay/OverlayWrapper";
import {Button} from "@mantine/core";
import {useContext} from "react";
import type {AppBuilderAgentOverlayProps} from "../config/appBuilderAgentHost";
import AppBuilderAgentFrame from "./AppBuilderAgentFrame";

export type {AppBuilderAgentOverlayProps};
export default function AppBuilderAgentOverlay({
	agentUrl,
	isAgentOpen,
	isAgentReady,
	onOpenAgent,
	onAgentWindow,
}: AppBuilderAgentOverlayProps) {
	const {viewportOverlayWrapper: {component: ViewportOverlayWrapper} = {}} =
		useContext(ComponentContext);

	if (!agentUrl || !ViewportOverlayWrapper) {
		return null;
	}

	return (
		<ViewportOverlayWrapper
			position={OverlayPosition.TOP_RIGHT}
			offset="1em"
		>
			{isAgentOpen ? (
				<AppBuilderAgentFrame
					src={agentUrl}
					onPeerWindow={onAgentWindow}
				/>
			) : (
				<Button disabled={!isAgentReady} onClick={onOpenAgent}>
					Open agent
				</Button>
			)}
		</ViewportOverlayWrapper>
	);
}
