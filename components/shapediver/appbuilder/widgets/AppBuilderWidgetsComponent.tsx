import React from "react";
import { 
	IAppBuilderWidget, 
	isAccordionWidget, 
	isAreaChartWidget, 
	isBarChartWidget, 
	isImageWidget, 
	isLineChartWidget, 
	isRoundChartWidget, 
	isTextWidget,
	isActionsWidget,
	isAgentWidget,
} from "../../../../types/shapediver/appbuilder";
import AppBuilderTextWidgetComponent from "./AppBuilderTextWidgetComponent";
import AppBuilderImageWidgetComponent from "./AppBuilderImageWidgetComponent";
import AppBuilderAccordionWidgetComponent from "./AppBuilderAccordionWidgetComponent";
import AppBuilderRoundChartWidgetComponent from "./AppBuilderRoundChartWidgetComponent";
import AppBuilderLineChartWidgetComponent from "./AppBuilderLineChartWidgetComponent";
import AppBuilderAreaChartWidgetComponent from "./AppBuilderAreaChartWidgetComponent";
import AppBuilderBarChartWidgetComponent from "./AppBuilderBarChartWidgetComponent";
import AppBuilderActionsWidgetComponent from "./AppBuilderActionsWidgetComponent";
import AppBuilderAgentWidgetComponent from "./AppBuilderAgentWidgetComponent";

interface Props {
	/** 
	 * Default session namespace to use for parameter and export references that do 
	 * not specify a session namespace.
	 */
	namespace: string,
	/** The widgets to display. */
	widgets: IAppBuilderWidget[] | undefined,
}

export default function AppBuilderWidgetsComponent({ namespace, widgets }: Props) {

	if (!widgets) {
		return <></>;
	}

	return <>
		{ widgets.map((w, i) => {
			if (isTextWidget(w))
				return <AppBuilderTextWidgetComponent key={i} {...w.props} />;
			else if (isImageWidget(w))
				return <AppBuilderImageWidgetComponent key={i} namespace={namespace} {...w.props} />;
			else if (isAccordionWidget(w))
				return <AppBuilderAccordionWidgetComponent key={i} namespace={namespace} {...w.props} />;
			else if (isRoundChartWidget(w))
				return <AppBuilderRoundChartWidgetComponent key={i} {...w.props} />;
			else if (isLineChartWidget(w))
				return <AppBuilderLineChartWidgetComponent key={i} {...w.props} />;
			else if (isAreaChartWidget(w))
				return <AppBuilderAreaChartWidgetComponent key={i} {...w.props} />;
			else if (isBarChartWidget(w))
				return <AppBuilderBarChartWidgetComponent key={i} {...w.props} />;
			else if (isActionsWidget(w))
				return <AppBuilderActionsWidgetComponent key={i} namespace={namespace} {...w.props} />;
			else if (isAgentWidget(w))
				return <AppBuilderAgentWidgetComponent key={i} namespace={namespace} {...w.props} />;
			else
				return null;
		})}
	</>;

}
