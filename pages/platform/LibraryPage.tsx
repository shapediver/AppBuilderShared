import ModelLibrary, {
	IModelLibraryProps,
} from "@AppBuilderShared/components/shapediver/platform/ModelLibrary";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import {BoxProps} from "@mantine/core";
import React, {useMemo} from "react";
import classes from "./LibraryPage.module.css";

export interface IModelLibraryTabProps extends IModelLibraryProps {
	name: string;
	tooltip?: string;
}

export interface LibraryPageProps extends BoxProps {
	tabs: IModelLibraryTabProps[];
}

export default function LibraryPage(props: LibraryPageProps) {
	const {tabs, ...rest} = props;

	const tabDefinitions = useMemo((): ITabsComponentProps | undefined => {
		if (tabs.length === 0) {
			return;
		}

		return {
			defaultValue: tabs[0].name,
			tabs: tabs.map((tab) => {
				const {name, tooltip, ...rest} = tab;

				return {
					name,
					tooltip,
					children: [<ModelLibrary key={name} {...rest} />],
					className: classes.tabsPanels,
				};
			}),
		};
	}, [tabs]);

	return (
		tabDefinitions && (
			<TabsComponent
				className={classes.tabsRoot}
				{...tabDefinitions}
				{...rest}
			/>
		)
	);
}
