import AppBuilderAccordionWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAccordionWidgetComponent";
import AppBuilderActionsWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderActionsWidgetComponent";
import AppBuilderAreaChartWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAreaChartWidgetComponent";
import AppBuilderBarChartWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderBarChartWidgetComponent";
import AppBuilderImageWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderImageWidgetComponent";
import AppBuilderLineChartWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderLineChartWidgetComponent";
import AppBuilderProgressWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderProgressWidgetComponent";
import AppBuilderRoundChartWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderRoundChartWidgetComponent";
import AppBuilderTextWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderTextWidgetComponent";
import {ComponentContext} from "@AppBuilderShared/context/ComponentContext";
import {
	IAppBuilderWidget,
	isAccordionWidget,
	isActionsWidget,
	isAgentWidget,
	isAreaChartWidget,
	isBarChartWidget,
	isDesktopClientOutputsWidget,
	isDesktopClientSelectionWidget,
	isImageWidget,
	isLineChartWidget,
	isProgressWidget,
	isRoundChartWidget,
	isSceneTreeExplorerWidget,
	isTextWidget,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {Loader, Paper} from "@mantine/core";
import React, {Suspense, useContext} from "react";
import AppBuilderDesktopClientOutputsWidgetComponent from "./AppBuilderDesktopClientOutputsWidgetComponent";
import AppBuilderDesktopClientSelectionWidgetComponent from "./AppBuilderDesktopClientSelectionWidgetComponent";
import AppBuilderSceneTreeExplorerWidgetComponent from "./AppBuilderSceneTreeExplorerWidgetComponent";
const LazyAppBuilderAgentWidgetComponent = React.lazy(
	() => import("./AppBuilderAgentWidgetComponent"),
);

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
						<Suspense
							key={i}
							name="LazyAppBuilderAgentWidgetComponent"
							fallback={
								<Paper>
									<Loader />
								</Paper>
							}
						>
							<LazyAppBuilderAgentWidgetComponent
								namespace={namespace}
								{...w.props}
							/>
						</Suspense>
					);
				else if (isProgressWidget(w))
					return (
						<AppBuilderProgressWidgetComponent
							key={i}
							{...w.props}
						/>
					);
				else if (isDesktopClientSelectionWidget(w))
					return (
						<AppBuilderDesktopClientSelectionWidgetComponent
							key={i}
							{...w.props}
						/>
					);
				else if (isDesktopClientOutputsWidget(w))
					return (
						<AppBuilderDesktopClientOutputsWidgetComponent
							key={i}
							namespace={namespace}
							{...w.props}
						/>
					);
				else if (isSceneTreeExplorerWidget(w))
					return (
						<AppBuilderSceneTreeExplorerWidgetComponent
							key={i}
							{...w.props}
						/>
					);
				else return null;
			})}
		</>
	);
}
