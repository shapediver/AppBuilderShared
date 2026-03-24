import {
	ComponentContext,
	IAppBuilderWidget,
	isAccordionUiWidget,
	isAccordionWidget,
	isActionsWidget,
	isAgentWidget,
	isAreaChartWidget,
	isBarChartWidget,
	isControlsWidget,
	isDesktopClientOutputsWidget,
	isDesktopClientSelectionWidget,
	isFormWidget,
	isImageWidget,
	isLineChartWidget,
	isProgressWidget,
	isRoundChartWidget,
	isSavedStatesWidget,
	isStackUiWidget,
	isTableWidget,
	isTextWidget,
} from "@AppBuilderLib/features/appbuilder";
import AppBuilderTableWidgetComponent from "./AppBuilderTableWidgetComponent";
import {Loader, Paper} from "@mantine/core";
import React, {Suspense, useContext} from "react";
import AppBuilderAccordionUiWidgetComponent from "./AppBuilderAccordionUiWidgetComponent";
import AppBuilderAccordionWidgetComponent from "./AppBuilderAccordionWidgetComponent";
import AppBuilderActionsWidgetComponent from "./AppBuilderActionsWidgetComponent";
import AppBuilderAreaChartWidgetComponent from "./AppBuilderAreaChartWidgetComponent";
import AppBuilderBarChartWidgetComponent from "./AppBuilderBarChartWidgetComponent";
import AppBuilderControlsWidgetComponent from "./AppBuilderControlsWidgetComponent";
import AppBuilderDesktopClientOutputsWidgetComponent from "./AppBuilderDesktopClientOutputsWidgetComponent";
import AppBuilderDesktopClientSelectionWidgetComponent from "./AppBuilderDesktopClientSelectionWidgetComponent";
import AppBuilderFormWidgetComponent from "./AppBuilderFormWidgetComponent";
import AppBuilderImageWidgetComponent from "./AppBuilderImageWidgetComponent";
import AppBuilderLineChartWidgetComponent from "./AppBuilderLineChartWidgetComponent";
import AppBuilderProgressWidgetComponent from "./AppBuilderProgressWidgetComponent";
import AppBuilderRoundChartWidgetComponent from "./AppBuilderRoundChartWidgetComponent";
import AppBuilderSavedStatesWidgetComponent from "./AppBuilderSavedStatesWidgetComponent";
import {AppBuilderStackUiWidgetButtonComponent} from "./AppBuilderStackUiWidget";
import AppBuilderTextWidgetComponent from "./AppBuilderTextWidgetComponent";
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
	widgets: (IAppBuilderWidget | JSX.Element)[] | undefined;
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
				else if (isAccordionUiWidget(w))
					return (
						<AppBuilderAccordionUiWidgetComponent
							key={i}
							namespace={namespace}
							{...w.props}
						/>
					);
				else if (isStackUiWidget(w))
					return (
						<AppBuilderStackUiWidgetButtonComponent
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
				else if (isControlsWidget(w))
					return (
						<AppBuilderControlsWidgetComponent
							key={i}
							namespace={namespace}
							{...w.props}
						/>
					);
				else if (isFormWidget(w))
					return (
						<AppBuilderFormWidgetComponent
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
				else if (isSavedStatesWidget(w))
					return (
						<AppBuilderSavedStatesWidgetComponent
							key={i}
							namespace={namespace}
							{...w.props}
						/>
					);
				else if (isTableWidget(w))
					return (
						<AppBuilderTableWidgetComponent
							key={i}
							{...w.props}
						/>
					);
				else if (React.isValidElement(w)) {
					// In this case, we can just return the element as is
					// As it is a valid React element
					// This is for example used in the useAppBuilderStoreStandardContainers
					return w;
				} else {
					return null;
				}
			})}
		</>
	);
}
