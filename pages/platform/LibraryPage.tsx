import React, { useMemo } from "react";
import { BoxProps } from "@mantine/core";
import classes from "./LibraryPage.module.css";
import ModelLibrary, { IModelLibraryProps } from "@AppBuilderShared/components/shapediver/platform/ModelLibrary";
import TabsComponent, { ITabsComponentProps } from "@AppBuilderShared/components/ui/TabsComponent";

export interface IModelLibraryTabProps extends IModelLibraryProps {
	name: string,
	tooltip?: string,
}

interface Props extends BoxProps {
	tabs: IModelLibraryTabProps[]
}

export default function LibraryPage(props: Props) {

	const { tabs, ...rest } = props;

	const tabDefinitions = useMemo((): ITabsComponentProps => {
		if (tabs.length === 0) {
			return {
				defaultValue: "",
				tabs: []
			};
		}

		return {
			defaultValue: tabs[0].name,
			tabs: tabs.map(tab => {
				const { name, tooltip, ...rest } = tab;

				return {
					name,
					tooltip,
					children: [<ModelLibrary key={name} {...rest} />],
					className: classes.tabsPanels
				};
			})
		};

	}, [tabs]);

	return (
		<TabsComponent className={classes.tabsRoot} {...tabDefinitions} {...rest}/>
	);
}
