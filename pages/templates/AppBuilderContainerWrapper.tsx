import {AppBuilderContainerOrientation} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContainerOrientation";
import {
	AppBuilderContainerContext,
	AppBuilderTemplateContext,
} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {IAppBuilderContainerContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext.types";
import ThemeProvider from "@AppBuilderLib/shared/ui/theme/ThemeProvider";
import AppBuilderContainer from "@AppBuilderShared/pages/templates/AppBuilderContainer";
import {
	Box,
	MantineThemeComponent,
	MantineThemeOverride,
	useProps,
} from "@mantine/core";
import React, {useContext} from "react";
import type {AppBuilderContainerThemeDefaultProps} from "shared/pages/config/AppBuilderContainer.types";

interface Props {
	name: string;
	orientation?: AppBuilderContainerThemeDefaultProps["orientation"];
	children?: React.ReactNode;
}

/** Type for defining them overrides per Template name and AppBuilder container name */
type ThemeOverridePerContainerType = {
	[key: string]: {[key: string]: MantineThemeOverride};
};

/**
 * @docAttached
 * @category page
 * @configPath themeOverrides.components.AppBuilderContainerWrapper.defaultProps
 * @displayName AppBuilderContainerWrapper
 */
export interface IAppBuilderContainerWrapperStyleProps {
	/** Theme overrides per container */
	containerThemeOverrides: ThemeOverridePerContainerType;
}

const defaultStyleProps: IAppBuilderContainerWrapperStyleProps = {
	containerThemeOverrides: {},
};

type AppBuilderContainerWrapperThemePropsType =
	Partial<IAppBuilderContainerWrapperStyleProps>;

export function AppBuilderContainerWrapperThemeProps(
	props: AppBuilderContainerWrapperThemePropsType,
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
export default function AppBuilderContainerWrapper(
	props: Props & AppBuilderContainerWrapperThemePropsType,
) {
	const {
		containerThemeOverrides: _themeOverrides,
		name,
		orientation = AppBuilderContainerOrientation.Unspecified,
		children,
	} = props;

	// style properties
	const {containerThemeOverrides} = useProps(
		"AppBuilderContainerWrapper",
		defaultStyleProps,
		{containerThemeOverrides: _themeOverrides},
	);

	const context: IAppBuilderContainerContext = {
		orientation,
		name,
	};

	const {name: template} = useContext(AppBuilderTemplateContext);

	const c = (
		<AppBuilderContainerContext.Provider value={context}>
			<Box
				data-app-builder-container={name}
				h="100%"
				w="100%"
				mih={0}
				miw={0}
			>
				<AppBuilderContainer orientation={orientation}>
					{children}
				</AppBuilderContainer>
			</Box>
		</AppBuilderContainerContext.Provider>
	);

	if (containerThemeOverrides[template]?.[name]) {
		const theme = containerThemeOverrides[template]?.[name];

		return <ThemeProvider theme={theme}>{c}</ThemeProvider>;
	} else {
		return c;
	}
}
