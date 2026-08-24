import type {
	IAppBuilder,
	IAppBuilderSettingsJson,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

/** Inputs for {@link useAppBuilderAgentHost} on an App Builder page. */
export type UseAppBuilderAgentHostProps = {
	namespace?: string;
	appBuilderData?: IAppBuilder;
	appBuilderParseSettled?: boolean;
	settings?: Pick<IAppBuilderSettingsJson, "settings">;
};

/**
 * Controlled view for {@link AppBuilderAgentOverlay}.
 * Host hook returns this; overlay does not own URL or transports.
 */
export type AppBuilderAgentOverlayProps = {
	agentUrl?: string;
	isAgentOpen: boolean;
	/** Tools snapshot is ready — Open agent button may be clicked. */
	isAgentReady: boolean;
	onOpenAgent: () => void;
	onAgentWindow: (agentWindow: Window | null) => void;
};
