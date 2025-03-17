import ThemeProvider from "@AppBuilderShared/components/shapediver/ui/ThemeProvider";
import {
	AppBuilderContainerContext,
	AppBuilderTemplateContext,
} from "@AppBuilderShared/context/AppBuilderContext";
import AppBuilderContainer from "@AppBuilderShared/pages/templates/AppBuilderContainer";
import {
	AppBuilderContainerOrientationType,
	IAppBuilderContainerContext,
} from "@AppBuilderShared/types/context/appbuildercontext";
import {
	MantineThemeComponent,
	MantineThemeOverride,
	useProps,
} from "@mantine/core";
import React, {useContext} from "react";

interface Props {
	name: string;
	orientation?: AppBuilderContainerOrientationType;
	children?: React.ReactNode;
}

/** Type for defining them overrides per Template name and AppBuilder container name */
type ThemeOverridePerContainerType = {
	[key: string]: {[key: string]: MantineThemeOverride};
};

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
		orientation = "unspecified",
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
			<AppBuilderContainer orientation={orientation}>
				{children}
			</AppBuilderContainer>
		</AppBuilderContainerContext.Provider>
	);

	if (containerThemeOverrides[template]?.[name]) {
		const theme = containerThemeOverrides[template]?.[name];

		return <ThemeProvider theme={theme}>{c}</ThemeProvider>;
	} else {
		return c;
	}
}
