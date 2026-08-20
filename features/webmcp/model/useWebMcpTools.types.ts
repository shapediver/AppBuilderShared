import type {IAppBuilder} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export interface UseWebMcpToolsProps {
	namespace?: string;
	enabled?: boolean;
	appBuilderData?: IAppBuilder;
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
