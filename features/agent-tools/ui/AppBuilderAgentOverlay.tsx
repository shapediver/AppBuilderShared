import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {OverlayPosition} from "@AppBuilderLib/shared/ui/overlay/OverlayWrapper";
import {Button} from "@mantine/core";
import {useContext} from "react";
import type {AppBuilderAgentOverlayProps} from "../config/appBuilderAgentHost";

export type {AppBuilderAgentOverlayProps};
export default function AppBuilderAgentOverlay({
	agentUrl,
	isAgentReady,
	onOpenAgent,
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
			<Button disabled={!isAgentReady} onClick={onOpenAgent}>
				Open agent
			</Button>
		</ViewportOverlayWrapper>
	);
}
