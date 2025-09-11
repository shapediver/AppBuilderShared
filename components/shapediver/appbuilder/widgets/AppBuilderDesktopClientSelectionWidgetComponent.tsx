import {IAppBuilderWidgetPropsDesktopClientSelection} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";
import DesktopClientPanel from "../../stargate/DesktopClientPanel";

//type Props = IAppBuilderWidgetPropsDesktopClientSelection;

export default function AppBuilderDesktopClientSelectionWidgetComponent(
	props: IAppBuilderWidgetPropsDesktopClientSelection,
) {
	return <DesktopClientPanel {...props} />;
}
