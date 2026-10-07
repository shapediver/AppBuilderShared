import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {AgentUiMode} from "../lib/resolveAgentUi";
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
 * The toolbar button is registered by the host hook.
 */
export type AppBuilderAgentOverlayProps = {
	agentUrl?: string;
	mode: AgentUiMode;
	/** Iframe has been created at least once. Later hides keep it mounted. */
	panelMounted: boolean;
	panelVisible: boolean;
};
