export interface UseWebMcpToolsProps {
	namespace?: string;
	enabled?: boolean;
	/**
	 * Tool names (`tool.name`) to NOT register. Changing this re-registers:
	 * the effect aborts the previous cycle's shared AbortSignal (unregistering
	 * all tools from that cycle) then re-registers, skipping these names.
	 * Default: all tools registered.
	 */
	disabledTools?: string[];
}

export interface WebMcpEnvironment {
	modelContextAvailable: boolean;
	crossOriginIsolated: boolean;
}

export interface UseWebMcpToolsResult {
	/** Tools registered on `modelContext` (registration may succeed without COI). */
	registered: boolean;
	/** Tools callable by agents: `registered` and cross-origin isolated with `modelContext`. */
	ready: boolean;
	environment: WebMcpEnvironment;
}
