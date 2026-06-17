import {IAppBuilderStackContextElement} from "@AppBuilderLib/features/appbuilder/lib/StackContext.types";
import {MantineThemeComponent} from "@mantine/core";
import React from "react";
import {AppBuilderStackUiWidgetAnimationWrapper} from "./AppBuilderStackUiWidgetAnimationWrapper";
import {StyleProps as StylePropsButton} from "./AppBuilderStackUiWidgetButtonComponent";
import AppBuilderStackUiWidgetContentComponent, {
	StyleProps as StylePropsContent,
} from "./AppBuilderStackUiWidgetContentComponent";

interface Props {
	namespace: string;
	stackElement: IAppBuilderStackContextElement | undefined;
	children: React.ReactNode;
}

/**
 * Theme props for stack UI (merged content + button surfaces). Consumed via `useProps("AppBuilderStackUiWidgetComponent", …)` in child components.
 *
 * @docAttached
 * @category widget
 * @configPath themeOverrides.components.AppBuilderStackUiWidgetComponent.defaultProps
 * @displayName AppBuilderStackUiWidgetComponent
 */
export interface AppBuilderStackUiWidgetComponentStyleProps
	extends Partial<StylePropsContent>, Partial<StylePropsButton> {}

type AppBuilderStackUiWidgetComponentThemePropsType =
	AppBuilderStackUiWidgetComponentStyleProps;

export function AppBuilderStackUiWidgetComponentThemeProps(
	props: AppBuilderStackUiWidgetComponentThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

export default function AppBuilderStackUiWidgetComponent({
	namespace,
	stackElement,
	children,
}: Props) {
	return (
		<AppBuilderStackUiWidgetAnimationWrapper
			isOpen={!!stackElement}
			fallbackContent={children}
		>
			{stackElement && (
				<AppBuilderStackUiWidgetContentComponent
					namespace={namespace}
					{...stackElement}
				/>
			)}
		</AppBuilderStackUiWidgetAnimationWrapper>
	);
}
