import type {
	IAppBuilder,
	IAppBuilderSettingsJson,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export type UseAppBuilderAgentProps = {
	namespace?: string;
	appBuilderData?: IAppBuilder;
	appBuilderParseSettled?: boolean;
	settings?: Pick<IAppBuilderSettingsJson, "settings">;
};

export type AppBuilderAgentOverlayProps = {
	agentUrl?: string;
	agentOpen: boolean;
	snapshotComplete: boolean;
	onOpen: () => void;
	onPeerWindow: (peer: Window | null) => void;
};
