import type {IAppBuilderMobileFallbacks} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {APP_BUILDER_MOBILE_BREAKPOINT_DEFAULT} from "@AppBuilderLib/features/appbuilder/config/appbuilderMobileFallback";
import {type MantineBreakpoint, useProps} from "@mantine/core";

const defaultStyleProps = {
	template: "appshell" as const,
	showContainerButtons: false,
	mobileBreakpoint: APP_BUILDER_MOBILE_BREAKPOINT_DEFAULT,
};

type TemplateSelectorMobileThemeProps = {
	template?: "appshell" | "grid";
	showContainerButtons?: boolean;
	mobileBreakpoint?: MantineBreakpoint;
	mobileFallbacks?: IAppBuilderMobileFallbacks;
};

/**
 * Template-agnostic mobile layout theme: breakpoint and standard-container
 * fallbacks from `useProps("AppBuilderTemplateSelector")`.
 */
export function useAppBuilderMobileLayoutTheme(): {
	mobileBreakpoint: MantineBreakpoint;
	mobileFallbacks: IAppBuilderMobileFallbacks | undefined;
} {
	const {mobileBreakpoint, mobileFallbacks} = useProps(
		"AppBuilderTemplateSelector",
		defaultStyleProps,
		{} as Partial<TemplateSelectorMobileThemeProps>,
	);
	return {
		mobileBreakpoint:
			mobileBreakpoint ?? APP_BUILDER_MOBILE_BREAKPOINT_DEFAULT,
		mobileFallbacks,
	};
}
