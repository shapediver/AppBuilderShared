import type {IAgentSessionInfo} from "../config/toolsApi";

/**
 * Controller-session fields copied into a ToolsApi handshake.
 * `jwtToken` is optional on ticket-only sessions.
 */
export type AgentHostControllerSession = {
	jwtToken?: string;
	slug?: string;
	modelStateId?: string;
};

/**
 * Session fields for the next ToolsApi handshake.
 *
 * Refresh stores the new geometry JWT on the viewer session (`setJwtToken`).
 * The settings DTO keeps the token from the first resolve unless the caller
 * writes it back, so a reconnect must prefer the live viewer token.
 */
export function agentSessionInfoForHost(
	controllerSession: AgentHostControllerSession | undefined,
	liveJwtToken?: string,
): IAgentSessionInfo | undefined {
	if (!controllerSession) {
		return undefined;
	}
	return {
		jwtToken: liveJwtToken || controllerSession.jwtToken,
		slug: controllerSession.slug,
		modelStateId: controllerSession.modelStateId,
	};
}
