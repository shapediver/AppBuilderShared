import {
	AppBuilderContainerOrientation,
	resolveAppBuilderContainerOrientation,
} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContainerOrientation";
import {AppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {IAppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext.types";
import {usePropsAppBuilder} from "@AppBuilderLib/features/appbuilder/model/usePropsAppBuilder";
import AppBuilderHorizontalContainer, {
	AppBuilderHorizontalContainerThemePropsType,
} from "@AppBuilderShared/pages/templates/AppBuilderHorizontalContainer";
import AppBuilderVerticalContainer, {
	AppBuilderVerticalContainerThemePropsType,
} from "@AppBuilderShared/pages/templates/AppBuilderVerticalContainer";
import {MantineThemeComponent, StyleProp} from "@mantine/core";
import React, {CSSProperties, useContext} from "react";
import type {AppBuilderContainerThemeDefaultProps} from "shared/pages/config/AppBuilderContainer.types";

interface Props {
	children?: React.ReactNode;
	style?: StyleProp<CSSProperties>;
}

const defaultStyleProps = {
	orientation: AppBuilderContainerOrientation.Unspecified,
} as const satisfies Pick<AppBuilderContainerThemeDefaultProps, "orientation">;

/**
 * Orientation plus forwarded horizontal / vertical container theme props for {@link AppBuilderContainer}.
 *
 * @docAttached
 * @category page
 * @configPath themeOverrides.components.AppBuilderContainer.defaultProps
 * @displayName AppBuilderContainer
 */
type AppBuilderContainerThemePropsType = Partial<
	Pick<AppBuilderContainerThemeDefaultProps, "orientation">
> &
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

	const {name, orientation: parentOrientation} = useContext(
		AppBuilderContainerContext,
	);

	const context: IAppBuilderContainerContext = {
		orientation: resolveAppBuilderContainerOrientation(
			orientation,
			parentOrientation,
			name,
		),
		name,
	};

	const container =
		context.orientation === AppBuilderContainerOrientation.Vertical ? (
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
