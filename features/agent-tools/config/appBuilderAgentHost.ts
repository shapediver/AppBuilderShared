import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {IAgentSessionInfo} from "./toolsApi";

/** Inputs for {@link useAppBuilderAgentHost} on an App Builder page. */
export type UseAppBuilderAgentHostProps = {
	namespace?: string;
	appBuilderData?: IAppBuilder;
	appBuilderParseSettled?: boolean;
	/** Controller session fields for ToolsApi `getSessionInfo`. */
	sessionInfo?: IAgentSessionInfo;
};

/**
 * Controlled view for {@link AppBuilderAgentOverlay}.
 * Host hook returns this; overlay does not own URL or transports.
 */
export type AppBuilderAgentOverlayProps = {
	agentUrl?: string;
	/** Tools snapshot is ready — Open agent button may be clicked. */
	isAgentReady: boolean;
	onOpenAgent: () => void;
};
