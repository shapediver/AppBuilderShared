import {AppBuilderTemplateContext} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderContext";
import {AppBuilderTemplateThemeId} from "@AppBuilderLib/features/appbuilder/lib/AppBuilderTemplate";
import AppBuilderAppShellTemplatePage from "@AppBuilderShared/pages/templates/AppBuilderAppShellTemplatePage";
import AppBuilderGridTemplatePage from "@AppBuilderShared/pages/templates/AppBuilderGridTemplatePage";
import {Button, MantineThemeComponent, useProps} from "@mantine/core";
import React, {ReactElement, useState} from "react";
import type {AppBuilderTemplateSelectorThemeDefaultProps} from "./AppBuilderTemplateSelector.types";
import {IAppBuilderTemplatePageProps} from "../config/appbuildertemplates";
import classes from "./AppBuilderTemplateSelector.module.css";

type TemplateMapType = Record<
	AppBuilderTemplateThemeId,
	(props: IAppBuilderTemplatePageProps) => ReactElement
>;

const templateMap: TemplateMapType = {
	appshell: AppBuilderAppShellTemplatePage,
	grid: AppBuilderGridTemplatePage,
};

const defaultStyleProps = {
	template: "appshell" as const,
	showContainerButtons: false,
} as const satisfies AppBuilderTemplateSelectorThemeDefaultProps;

type AppBuilderTemplateSelectorThemePropsType =
	Partial<AppBuilderTemplateSelectorThemeDefaultProps>;

export function AppBuilderTemplateSelectorThemeProps(
	props: AppBuilderTemplateSelectorThemePropsType,
): MantineThemeComponent {
	return {
		defaultProps: props,
	};
}

const showContainer = (toggleState: boolean | undefined): boolean =>
	toggleState === undefined || toggleState === true;

const buttonVariant = (toggleState: boolean | undefined) =>
	toggleState === undefined ? "outline" : toggleState ? "filled" : "light";

export default function AppBuilderTemplateSelector(
	props: IAppBuilderTemplatePageProps &
		Partial<AppBuilderTemplateSelectorThemeDefaultProps>,
) {
	// style properties
	const {template, showContainerButtons, ...nodes} = useProps(
		"AppBuilderTemplateSelector",
		defaultStyleProps,
		props,
	);

	const {top, left, right, bottom, ...otherNodes} = nodes;

	const [isTopDisplayed, setIsTopDisplayed] = useState<boolean | undefined>(
		undefined,
	);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState<boolean | undefined>(
		undefined,
	);
	const [isRightDisplayed, setIsRightDisplayed] = useState<
		boolean | undefined
	>(undefined);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState<
		boolean | undefined
	>(undefined);

	const mainNodes = {
		top: showContainer(isTopDisplayed) ? top : undefined,
		left: showContainer(isLeftDisplayed) ? left : undefined,
		right: showContainer(isRightDisplayed) ? right : undefined,
		bottom: showContainer(isBottomDisplayed) ? bottom : undefined,
	};

	const Template = templateMap[template];

	return (
		<>
			{showContainerButtons ? (
				<Button.Group className={classes.buttonsTop}>
					<Button
						variant={buttonVariant(isTopDisplayed)}
						onClick={() => setIsTopDisplayed(!isTopDisplayed)}
					>
						Top
					</Button>
					<Button
						variant={buttonVariant(isLeftDisplayed)}
						onClick={() => setIsLeftDisplayed(!isLeftDisplayed)}
						color="indigo"
					>
						Left
					</Button>
					<Button
						variant={buttonVariant(isRightDisplayed)}
						onClick={() => setIsRightDisplayed(!isRightDisplayed)}
						color="violet"
					>
						Right
					</Button>
					<Button
						variant={buttonVariant(isBottomDisplayed)}
						onClick={() => setIsBottomDisplayed(!isBottomDisplayed)}
						color="cyan"
					>
						Bottom
					</Button>
				</Button.Group>
			) : (
				<></>
			)}
			<AppBuilderTemplateContext.Provider value={{name: template}}>
				<Template {...mainNodes} {...otherNodes} />
			</AppBuilderTemplateContext.Provider>
		</>
	);
}
