import React, { useContext } from "react";
import { MantineStyleProp, MantineThemeComponent, Paper, PaperProps, useProps } from "@mantine/core";
import { IAppBuilderWidgetPropsAgent } from "../../../../types/shapediver/appbuilder";
import MarkdownWidgetComponent from "../../ui/MarkdownWidgetComponent";
import { AppBuilderContainerContext } from "../../../../context/AppBuilderContext";
import { useAllParameters } from "../../../../hooks/shapediver/parameters/useAllParameters";

/** Style properties that can be controlled via the theme. */
type StylePros = PaperProps & {
	
};

/** Default values for style properties. */
const defaultStyleProps : Partial<StylePros> = {
};

type AppBuilderAgentWidgetThemePropsType = Partial<StylePros>;

export function AppBuilderAgentWidgetThemeProps(props: AppBuilderAgentWidgetThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

type Props = IAppBuilderWidgetPropsAgent & {
	namespace: string;
};

export default function AppBuilderAgentWidgetComponent(props: Props & AppBuilderAgentWidgetThemePropsType) {
	
	const { namespace, context, ...rest } = props;
	const themeProps = useProps("AppBuilderAgentWidgetComponent", defaultStyleProps, rest);
	
	// get access to all parameters
	const { parameters } = useAllParameters(namespace);
	console.log("AppBuilderAgentWidgetComponent: Available parameters", parameters);

	// get access to all dynamic parameters
	const { parameters: dynamicParameters } = useAllParameters(`${namespace}_appbuilder`);
	console.log("AppBuilderAgentWidgetComponent: Available dynamic parameters", dynamicParameters);
	
	const markdown = `# AI Agent Widget
## Context
Context provided from Grasshopper: 

_${context}_
	
## Parameters
${Object.values(parameters).map(p => `* ${p.definition.name} (${p.definition.type})`).join("\n")}

## Dynamic Parameters
${Object.values(dynamicParameters).map(p => `* ${p.definition.name} (${p.definition.type})`).join("\n")}
`;

	// check for container alignment
	const containerContext = useContext(AppBuilderContainerContext);
	const styleProps: MantineStyleProp = {};
	if (containerContext.orientation === "horizontal") {
		styleProps.height = "100%";
	} else if (containerContext.orientation === "vertical") {
		styleProps.overflowX = "auto";
	}
	styleProps.fontWeight = "100";

	return <Paper {...themeProps} style={styleProps}>
		<MarkdownWidgetComponent>
			{ markdown }
		</MarkdownWidgetComponent>
	</Paper>;
}
