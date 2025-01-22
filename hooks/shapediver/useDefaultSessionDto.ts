import { IAppBuilderSettingsSession } from "@AppBuilderShared/types/shapediver/appbuilder";
import { IShapeDiverExampleModels } from "@AppBuilderShared/types/shapediver/examplemodel";
import { MantineThemeComponent, useProps } from "@mantine/core";
import { useMemo } from "react";

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
	/** Available example models */
	exampleModels?: IShapeDiverExampleModels;
}

const defaultProps: Partial<Props> = {
	acceptRejectMode: false
};

type DefaultSessionThemePropsType = Partial<Props>;

export function DefaultSessionThemeProps(props: DefaultSessionThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Use default session settings. In case no session settings are provided, 
 * the hook will use settings defined in section "DefaultSession" of the theme.
 * @param props 
 * @returns 
 */
export default function useDefaultSessionDto(props: Partial<Props>) {

	const { example, exampleModels, id = "default", ticket, modelViewUrl, slug, ...rest } = useProps("DefaultSession", defaultProps, props);

	const defaultSessionDto: IAppBuilderSettingsSession | undefined = useMemo(() => example && exampleModels && example in exampleModels ? {
		id,
		...exampleModels[example],
		...rest
	} : ticket && modelViewUrl ? {
		id,
		ticket,
		modelViewUrl,
		...rest
	} : slug ? {
		id,
		slug,
		modelViewUrl: "",
		...rest
	} : undefined, [example, id, ticket, modelViewUrl, slug]);

	return {
		defaultSessionDto
	};
}
