import {AppBuilderActionFromType} from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionFromType";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {IAppBuilderWidgetPropsActions} from "@AppBuilderShared/types/shapediver/appbuilder";
import {
	Group,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Stack,
} from "@mantine/core";
import React, {useContext} from "react";

type StylePros = PaperProps;

// const defaultStyleProps : Partial<StylePros> = {
// };

type AppBuilderActionsWidgetThemePropsType = Partial<StylePros>;

export function AppBuilderActionWidgetThemeProps(
	props: AppBuilderActionsWidgetThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

type Props = IAppBuilderWidgetPropsActions & {
	namespace: string;
};

export default function AppBuilderActionsWidgetComponent(
	props: Props & AppBuilderActionsWidgetThemePropsType,
) {
	const {
		actions,
		namespace,
		//...rest
	} = props;

	//const themeProps = useProps("AppBuilderActionsWidgetComponent", defaultStyleProps, rest);

	const context = useContext(AppBuilderContainerContext);

	if (!actions || actions.length === 0) {
		return <></>;
	}

	const actionComponents = actions.map((action, i) => {
		return AppBuilderActionFromType(action, namespace, i);
	});

	if (actions.length === 1) return actionComponents[0];

	return (
		<Paper>
			{context.orientation === "vertical" ? (
				<Stack>{actionComponents}</Stack>
			) : (
				<Group>{actionComponents}</Group>
			)}
		</Paper>
	);
}
