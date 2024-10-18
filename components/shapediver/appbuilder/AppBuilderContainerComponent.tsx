import React from "react";
import { IAppBuilderContainer } from "../../../types/shapediver/appbuilder";
import AppBuilderWidgetsComponent from "./widgets/AppBuilderWidgetsComponent";
import AppBuilderTabsComponent from "./AppBuilderTabsComponent";

interface Props extends IAppBuilderContainer {
	/** 
	 * Default session namespace to use for parameter and export references that do 
	 * not specify a session namespace.
	 */
	namespace: string,
}

export default function AppBuilderContainerComponent({ namespace, widgets, tabs }: Props) {

	return <>
		<AppBuilderTabsComponent namespace={namespace} tabs={tabs} />
		<AppBuilderWidgetsComponent namespace={namespace} widgets={widgets} />
	</>;

}
