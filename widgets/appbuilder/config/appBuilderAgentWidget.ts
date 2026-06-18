import type {MantinePaperProps} from "@AppBuilderLib/shared/mantine-props/paper";
import {MantineThemeComponent} from "@mantine/core";

/**
 * Theme-driven Mantine `Paper` defaults for the agent widget wrapper.
 *
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderAgentWidgetComponent.defaultProps
 * @displayName AppBuilderAgentWidgetComponent
 */
export interface AppBuilderAgentWidgetComponentStyleProps extends MantinePaperProps {}

/** Agent configuration passed via theme `defaultProps` or widget props. */
export interface AppBuilderAgentWidgetComponentConfigProps {
	/** The system prompt to use. */
	systemPrompt: string;
	/** If provided, only parameters with these names are included. */
	parameterNamesToInclude: string[];
	/** If provided, parameters with these names are excluded. */
	parameterNamesToExclude: string[];
	/** Allows to override the context given by the author of the Grasshopper model via App Builder. */
	authorContext: string;
	/** Set to true to show and allow to edit system prompt and author context. */
	debug: boolean;
	/** Maximum number of messages to keep in the context for the chat completion. */
	maxHistory: number;
	/** The LLM to use. */
	model: string;
	/** Open AI API key. */
	openaiApiKey: string;
	/** Langfuse secret key. */
	langfuseSecretKey: string;
	/** Langfuse public key. */
	langfusePublicKey: string;
	/** Langfuse base URL. */
	langfuseBaseUrl: string;
}

export type AppBuilderAgentWidgetComponentProps =
	AppBuilderAgentWidgetComponentStyleProps &
		AppBuilderAgentWidgetComponentConfigProps;

export type AppBuilderAgentWidgetThemePropsType =
	Partial<AppBuilderAgentWidgetComponentProps>;

export function AppBuilderAgentWidgetThemeProps(
	props: AppBuilderAgentWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
