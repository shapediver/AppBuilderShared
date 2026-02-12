import DesktopClientPanel from "@AppBuilderLib/entities/stargate/ui/DesktopClientPanel";
import {IAppBuilderWidgetPropsDesktopClientSelection} from "@AppBuilderShared/types/shapediver/appbuilder";
import React from "react";

//type Props = IAppBuilderWidgetPropsDesktopClientSelection;

export default function AppBuilderDesktopClientSelectionWidgetComponent(
	props: IAppBuilderWidgetPropsDesktopClientSelection,
) {
	return <DesktopClientPanel {...props} />;
}
