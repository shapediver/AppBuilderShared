import type {AgentUiThemeDefaultProps} from "@AppBuilderLib/features/agent-tools/config/AgentUi.theme.types";
import {MantineThemeComponent} from "@mantine/core";

/**
 * Theme defaults for the agent chrome.
 *
 * `showThreadHistory` and `createThreadOnLoad` are omitted from the built-in
 * defaults. Both default on. Either flag can be set without the other.
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
