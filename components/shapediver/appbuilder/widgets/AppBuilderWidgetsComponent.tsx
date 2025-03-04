import React, {useContext, Suspense} from "react";
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
} from "@AppBuilderShared/types/shapediver/appbuilder";
import AppBuilderTextWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderTextWidgetComponent";
import AppBuilderImageWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderImageWidgetComponent";
import AppBuilderAccordionWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAccordionWidgetComponent";
import AppBuilderRoundChartWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderRoundChartWidgetComponent";
import AppBuilderLineChartWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderLineChartWidgetComponent";
import AppBuilderAreaChartWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAreaChartWidgetComponent";
import AppBuilderBarChartWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderBarChartWidgetComponent";
import AppBuilderActionsWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderActionsWidgetComponent";
import {ComponentContext} from "@AppBuilderShared/context/ComponentContext";
import { Loader, Paper } from "@mantine/core";
const LazyAppBuilderAgentWidgetComponent = React.lazy(() => import('./AppBuilderAgentWidgetComponent'));


interface Props {
	/**
	 * Default session namespace to use for parameter and export references that do
	 * not specify a session namespace.
	 */
	namespace: string;
	/** The widgets to display. */
	widgets: IAppBuilderWidget[] | undefined;
}

export default function AppBuilderWidgetsComponent({
	namespace,
	widgets,
}: Props) {
	if (!widgets) {
		return <></>;
	}

	const componentContext = useContext(ComponentContext);

	return (
		<>
			{widgets.map((w, i) => {
				// first we loop through all registered components to see if we can find a match
				// here some of the default widget could be overwritten by custom components
				for (const key in componentContext.widgets) {
					const componentDefinition = componentContext.widgets[key];
					if (componentDefinition.isComponent(w)) {
						const Component = componentDefinition.component;

						return (
							<Component
								key={i}
								namespace={namespace}
								{...w.props}
							/>
						);
					}
				}

				if (isTextWidget(w))
					return (
						<AppBuilderTextWidgetComponent key={i} {...w.props} />
					);
				else if (isImageWidget(w))
					return (
						<AppBuilderImageWidgetComponent
							key={i}
							namespace={namespace}
							{...w.props}
						/>
					);
				else if (isAccordionWidget(w))
					return (
						<AppBuilderAccordionWidgetComponent
							key={i}
							namespace={namespace}
							{...w.props}
						/>
					);
				else if (isRoundChartWidget(w))
					return (
						<AppBuilderRoundChartWidgetComponent
							key={i}
							{...w.props}
						/>
					);
				else if (isLineChartWidget(w))
					return (
						<AppBuilderLineChartWidgetComponent
							key={i}
							{...w.props}
						/>
					);
				else if (isAreaChartWidget(w))
					return (
						<AppBuilderAreaChartWidgetComponent
							key={i}
							{...w.props}
						/>
					);
				else if (isBarChartWidget(w))
					return (
						<AppBuilderBarChartWidgetComponent
							key={i}
							{...w.props}
						/>
					);
				else if (isActionsWidget(w))
					return (
						<AppBuilderActionsWidgetComponent
							key={i}
							namespace={namespace}
							{...w.props}
						/>
					);
				else if (isAgentWidget(w))
					return (
						<Suspense key={i} name="LazyAppBuilderAgentWidgetComponent" fallback={<Paper><Loader/></Paper>}>
							<LazyAppBuilderAgentWidgetComponent
								namespace={namespace}
								{...w.props}
							/>
						</Suspense>
					);
				else return null;
			})}
		</>
	);
}
