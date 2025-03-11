import AppBuilderActionAddToCartComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionAddToCartComponent";
import AppBuilderActionCloseConfiguratorComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCloseConfiguratorComponent";
import AppBuilderActionCreateModelStateComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCreateModelStateComponent";
import AppBuilderActionSetBrowserLocationComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetBrowserLocationComponent";
import AppBuilderActionSetParameterValueComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionSetParameterValueComponent";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {
	IAppBuilderWidgetPropsActions,
	isAddToCartAction,
	isCloseConfiguratorAction,
	isCreateModelStateAction,
	isSetBrowserLocationAction,
	isSetParameterValueAction,
} from "@AppBuilderShared/types/shapediver/appbuilder";
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
		if (isCreateModelStateAction(action))
			return (
				<AppBuilderActionCreateModelStateComponent
					key={i}
					namespace={namespace}
					{...action.props}
				/>
			);
		else if (isAddToCartAction(action))
			return (
				<AppBuilderActionAddToCartComponent
					key={i}
					namespace={namespace}
					{...action.props}
				/>
			);
		else if (isCloseConfiguratorAction(action))
			return (
				<AppBuilderActionCloseConfiguratorComponent
					key={i}
					{...action.props}
				/>
			);
		else if (isSetParameterValueAction(action))
			return (
				<AppBuilderActionSetParameterValueComponent
					key={i}
					namespace={namespace}
					{...action.props}
				/>
			);
		else if (isSetBrowserLocationAction(action))
			return (
				<AppBuilderActionSetBrowserLocationComponent
					key={i}
					{...action.props}
				/>
			);
		else return null;
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
