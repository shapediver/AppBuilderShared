import React, { ReactElement, useState } from "react";
import { Button, MantineThemeComponent, useProps } from "@mantine/core";
import classes from "./AppBuilderTemplateSelector.module.css";
import { IAppBuilderTemplatePageProps } from "@AppBuilderShared/types/pages/appbuildertemplates";
import { AppBuilderTemplateContext } from "@AppBuilderShared/context/AppBuilderContext";
import AppBuilderAppShellTemplatePage from "@AppBuilderShared/pages/templates/AppBuilderAppShellTemplatePage";
import AppBuilderGridTemplatePage from "@AppBuilderShared/pages/templates/AppBuilderGridTemplatePage";

export type AppBuilderTemplateType = "grid" | "appshell"

type TemplateMapType = Record<AppBuilderTemplateType, (props: IAppBuilderTemplatePageProps) => ReactElement>;

const templateMap: TemplateMapType = {
	"appshell": AppBuilderAppShellTemplatePage,
	"grid": AppBuilderGridTemplatePage,
};

interface StyleProps {
	/** template to use */
	template: AppBuilderTemplateType;
	/** Should buttons for showing/hiding the containers be shown? */
	showContainerButtons: boolean;
}

const defaultStyleProps: StyleProps = {
	template: "appshell",
	showContainerButtons: false,
};

type AppBuilderTemplateSelectorThemePropsType = Partial<StyleProps>;

export function AppBuilderTemplateSelectorThemeProps(props: AppBuilderTemplateSelectorThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

const showContainer = (toggleState: boolean | undefined): boolean => toggleState === undefined || toggleState === true;

const buttonVariant = (toggleState: boolean | undefined) => toggleState === undefined ? "outline" : toggleState ? "filled" : "light";

export default function AppBuilderTemplateSelector(props: IAppBuilderTemplatePageProps & Partial<StyleProps>) {

	// style properties
	const { 
		template,
		showContainerButtons,
		...nodes
	} = useProps("AppBuilderTemplateSelector", defaultStyleProps, props);

	const { top, left, right, bottom, ...otherNodes } = nodes;

	const [isTopDisplayed, setIsTopDisplayed] = useState<boolean|undefined>(undefined);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState<boolean|undefined>(undefined);
	const [isRightDisplayed, setIsRightDisplayed] = useState<boolean|undefined>(undefined);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState<boolean|undefined>(undefined);

	const mainNodes = {
		top: showContainer(isTopDisplayed) ? top : undefined,
		left: showContainer(isLeftDisplayed) ? left : undefined,
		right: showContainer(isRightDisplayed) ? right : undefined,
		bottom: showContainer(isBottomDisplayed) ? bottom : undefined,
	};

	const Template = templateMap[template];

	return (<>
		{showContainerButtons ? <Button.Group className={classes.buttonsTop}>
			<Button variant={buttonVariant(isTopDisplayed)} onClick={() => setIsTopDisplayed(!isTopDisplayed)}>Top</Button>
			<Button variant={buttonVariant(isLeftDisplayed)}  onClick={() => setIsLeftDisplayed(!isLeftDisplayed)} color="indigo">Left</Button>
			<Button variant={buttonVariant(isRightDisplayed)}  onClick={() => setIsRightDisplayed(!isRightDisplayed)} color="violet">Right</Button>
			<Button variant={buttonVariant(isBottomDisplayed)}  onClick={() => setIsBottomDisplayed(!isBottomDisplayed)} color="cyan">Bottom</Button>
		</Button.Group> : <></>}
		<AppBuilderTemplateContext.Provider value={{ name: template }}>
			<Template {...mainNodes} {...otherNodes} />
		</AppBuilderTemplateContext.Provider>
	</>
	);
}
