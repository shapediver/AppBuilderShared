import {DesktopClientPanel} from "@AppBuilderLib/entities/stargate";
import {IAppBuilderWidgetPropsDesktopClientSelection} from "@AppBuilderLib/features/appbuilder";
import React from "react";

//type Props = IAppBuilderWidgetPropsDesktopClientSelection;

export default function AppBuilderDesktopClientSelectionWidgetComponent(
	props: IAppBuilderWidgetPropsDesktopClientSelection,
) {
	return <DesktopClientPanel {...props} />;
}
