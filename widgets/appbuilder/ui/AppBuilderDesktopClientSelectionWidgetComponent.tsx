import DesktopClientPanel from "@AppBuilderLib/entities/stargate/ui/DesktopClientPanel";
import {IAppBuilderWidgetPropsDesktopClientSelection} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import React from "react";

//type Props = IAppBuilderWidgetPropsDesktopClientSelection;

export default function AppBuilderDesktopClientSelectionWidgetComponent(
	props: IAppBuilderWidgetPropsDesktopClientSelection,
) {
	return <DesktopClientPanel {...props} />;
}
