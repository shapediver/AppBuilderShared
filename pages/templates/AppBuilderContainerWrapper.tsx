import React, { useContext } from "react";
import { AppBuilderContainerContext, AppBuilderTemplateContext } from "../../context/AppBuilderContext";
import { MantineThemeComponent, MantineThemeOverride, MantineThemeProvider, useProps } from "@mantine/core";
import { AppBuilderContainerOrientationType, IAppBuilderContainerContext } from "../../types/context/appbuildercontext";
import AppBuilderContainer from "./AppBuilderContainer";

interface Props {
	name: string,
	orientation?: AppBuilderContainerOrientationType,
	children?: React.ReactNode,
}

/** Type for defining them overrides per Template name and AppBuilder container name */
type ThemeOverridePerContainerType = { [key: string]: { [key: string]: MantineThemeOverride } };

export interface IAppBuilderContainerWrapperStyleProps {
	/** Theme overrides per container */
	containerThemeOverrides: ThemeOverridePerContainerType;
}

const defaultStyleProps: IAppBuilderContainerWrapperStyleProps = {
	containerThemeOverrides: {}
};

type AppBuilderContainerWrapperThemePropsType = Partial<IAppBuilderContainerWrapperStyleProps>;

export function AppBuilderContainerWrapperThemeProps(props: AppBuilderContainerWrapperThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Wrapper for horizontal and vertical containers
 * @param props 
 * @returns 
 */
export default function AppBuilderContainerWrapper(props: Props & AppBuilderContainerWrapperThemePropsType) {
	const { 
		containerThemeOverrides: _themeOverrides, 
		name, 
		orientation = "unspecified", 
		children 
	} = props;

	// style properties
	const { 
		containerThemeOverrides,
	} = useProps("AppBuilderContainerWrapper", defaultStyleProps, { containerThemeOverrides: _themeOverrides});

	const context: IAppBuilderContainerContext = {
		orientation,
		name
	};

	const { name: template } = useContext(AppBuilderTemplateContext);
		
	const c = <AppBuilderContainerContext.Provider value={context}>
		<AppBuilderContainer orientation={orientation}>{children}</AppBuilderContainer>
	</AppBuilderContainerContext.Provider>;

	if (containerThemeOverrides[template]?.[name]) {
		const theme = containerThemeOverrides[template]?.[name];
		console.debug("AppBuilderContainerWrapper", context, theme, template, name);
		
		return <MantineThemeProvider theme={theme}>
			{c}
		</MantineThemeProvider>;
	}
	else {
		
		return c;
	}
	
}
