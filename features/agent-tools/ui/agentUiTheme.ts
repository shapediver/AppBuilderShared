import type {AgentUiThemeDefaultProps} from "@AppBuilderLib/features/agent-tools/config/AgentUi.theme.types";
import {MantineThemeComponent} from "@mantine/core";

/**
 * Theme defaults for the agent chrome.
 *
 * `showThreadHistory` is omitted from the built-in defaults. When an app does
 * not set it, window mode shows history and iframe mode hides it.
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
