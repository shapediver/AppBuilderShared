import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {OverlayPosition} from "@AppBuilderLib/shared/ui/overlay/OverlayWrapper";
import {Button} from "@mantine/core";
import {useContext} from "react";
import type {AppBuilderAgentOverlayProps} from "../model/useAppBuilderAgent";
import AppBuilderAgentFrame from "./AppBuilderAgentFrame";

export default function AppBuilderAgentOverlay({
	agentUrl,
	agentOpen,
	snapshotComplete,
	onOpen,
	onPeerWindow,
}: AppBuilderAgentOverlayProps) {
	const {
		viewportOverlayWrapper: {component: ViewportOverlayWrapper} = {},
	} = useContext(ComponentContext);

	if (!agentUrl || !ViewportOverlayWrapper) {
		return null;
	}

	return (
		<ViewportOverlayWrapper
			position={OverlayPosition.TOP_RIGHT}
			offset="1em"
		>
			{agentOpen ? (
				<AppBuilderAgentFrame
					src={agentUrl}
					onPeerWindow={onPeerWindow}
				/>
			) : (
				<Button disabled={!snapshotComplete} onClick={onOpen}>
					Open agent
				</Button>
			)}
		</ViewportOverlayWrapper>
	);
}
