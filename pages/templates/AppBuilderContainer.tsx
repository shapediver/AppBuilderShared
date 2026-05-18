import {AppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {
	AppBuilderContainerOrientationType,
	IAppBuilderContainerContext,
} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext.types";
import {usePropsAppBuilder} from "@AppBuilderLib/features/appbuilder/model/usePropsAppBuilder";
import AppBuilderHorizontalContainer, {
	AppBuilderHorizontalContainerThemePropsType,
} from "@AppBuilderShared/pages/templates/AppBuilderHorizontalContainer";
import AppBuilderVerticalContainer, {
	AppBuilderVerticalContainerThemePropsType,
} from "@AppBuilderShared/pages/templates/AppBuilderVerticalContainer";
import {MantineThemeComponent, StyleProp} from "@mantine/core";
import React, {CSSProperties, useContext} from "react";

interface Props {
	children?: React.ReactNode;
	style?: StyleProp<CSSProperties>;
}

interface StyleProps {
	orientation: AppBuilderContainerOrientationType;
}

const defaultStyleProps: StyleProps = {
	orientation: "unspecified",
};

type AppBuilderContainerThemePropsType = Partial<StyleProps> &
	AppBuilderVerticalContainerThemePropsType &
	AppBuilderHorizontalContainerThemePropsType;

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
	const {
		children,
		orientation: orientationProp,
		style,
		...containerProps
	} = props;

	// style properties
	const {orientation} = usePropsAppBuilder(
		"AppBuilderContainer",
		defaultStyleProps,
		{orientation: orientationProp},
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
			<AppBuilderVerticalContainer style={style} {...containerProps}>
				{children}
			</AppBuilderVerticalContainer>
		) : (
			<AppBuilderHorizontalContainer style={style} {...containerProps}>
				{children}
			</AppBuilderHorizontalContainer>
		);

	return (
		<AppBuilderContainerContext.Provider value={context}>
			{container}
		</AppBuilderContainerContext.Provider>
	);
}
