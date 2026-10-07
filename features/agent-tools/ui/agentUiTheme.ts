import type {AgentUiThemeDefaultProps} from "@AppBuilderLib/features/agent-tools/config/AgentUi.theme.types";
import {MantineThemeComponent} from "@mantine/core";

/**
 * Theme defaults for the agent chrome.
 *
 * `showThreadHistory` and `createThreadOnLoad` are omitted from the built-in
 * defaults. History is on unless set. When `createThreadOnLoad` is omitted,
 * iframe mode starts a new thread and window mode resumes the latest.
 * Either flag can be set without the other.
 *
 * @docAttached
 * @category appbuilder
 * @configPath themeOverrides.components.AgentUi.defaultProps
 * @displayName AgentUi
 */
export function AgentUiComponentThemeProps(
	props: AgentUiThemeDefaultProps,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}
