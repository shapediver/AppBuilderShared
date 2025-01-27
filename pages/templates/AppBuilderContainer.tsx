import React, {useContext} from "react";
import {MantineThemeComponent} from "@mantine/core";
import {AppBuilderContainerContext} from "@AppBuilderShared/context/AppBuilderContext";
import {usePropsAppBuilder} from "@AppBuilderShared/hooks/ui/usePropsAppBuilder";
import {
	AppBuilderContainerOrientationType,
	IAppBuilderContainerContext,
} from "@AppBuilderShared/types/context/appbuildercontext";
import AppBuilderHorizontalContainer from "@AppBuilderShared/pages/templates/AppBuilderHorizontalContainer";
import AppBuilderVerticalContainer from "@AppBuilderShared/pages/templates/AppBuilderVerticalContainer";

interface Props {
	children?: React.ReactNode;
}

interface StyleProps {
	orientation: AppBuilderContainerOrientationType;
}

const defaultStyleProps: StyleProps = {
	orientation: "unspecified",
};

type AppBuilderContainerThemePropsType = Partial<StyleProps>;

export function AppBuilderContainerThemeProps(
	props: AppBuilderContainerThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

/**
 * Wrapper for horizontal and vertical containers
 * @param props
 * @returns
 */
export default function AppBuilderContainer(
	props: Props & AppBuilderContainerThemePropsType,
) {
	const {children, ...rest} = props;

	// style properties
	const {orientation} = usePropsAppBuilder(
		"AppBuilderContainer",
		defaultStyleProps,
		rest,
	);

	const {name} = useContext(AppBuilderContainerContext);

	const context: IAppBuilderContainerContext = {
		orientation:
			!orientation || orientation === "unspecified"
				? name === "top" || name === "bottom"
					? "horizontal"
					: "vertical"
				: orientation,
		name,
	};

	const container =
		context.orientation === "vertical" ? (
			<AppBuilderVerticalContainer>
				{children}
			</AppBuilderVerticalContainer>
		) : (
			<AppBuilderHorizontalContainer>
				{children}
			</AppBuilderHorizontalContainer>
		);

	return (
		<AppBuilderContainerContext.Provider value={context}>
			{container}
		</AppBuilderContainerContext.Provider>
	);
}
