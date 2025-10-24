import {MantineThemeComponent} from "@mantine/core";
import React from "react";
import {StyleProps as StylePropsButton} from "~/shared/components/shapediver/appbuilder/widgets/AppBuilderStackUiWidget/AppBuilderStackUiWidgetButtonComponent";
import {IAppBuilderStackContextElement} from "~/shared/types/context/stackcontext";
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
		<>
			{stackElement ? (
				<AppBuilderStackUiWidgetContentComponent
					namespace={namespace}
					{...stackElement}
				/>
			) : (
				children
			)}
		</>
	);
}
