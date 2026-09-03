import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import type {IAppBuilderWidgetPropsActions} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {legacyActionToDefinition} from "@AppBuilderLib/features/appbuilder/lib/legacyActionToDefinition";
import {AppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {AppBuilderActionFromType} from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionFromType";
import {
	Group,
	MantineThemeComponent,
	Paper,
	PaperProps,
	Stack,
} from "@mantine/core";
import {useContext} from "react";

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
	const componentContext = useContext(ComponentContext);

	if (!actions || actions.length === 0) {
		return <></>;
	}

	const actionComponents = actions.map((action, i) => {
		const {id, icon, label, tooltip} = action.props;
		return AppBuilderActionFromType(
			{
				id,
				label,
				icon,
				tooltip,
				definition: legacyActionToDefinition(action),
			},
			namespace,
			i,
			componentContext,
		);
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
