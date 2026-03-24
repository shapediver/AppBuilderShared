import {IAppBuilderStackContextElement} from "@AppBuilderLib/features/appbuilder";
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

type AppBuilderStackUiWidgetComponentThemePropsType = Partial<
	StylePropsContent & StylePropsButton
>;

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
