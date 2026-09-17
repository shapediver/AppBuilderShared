import {ComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext";
import {
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
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {APP_BUILDER_SLOT_EVENTS} from "@AppBuilderLib/features/appbuilder/lib/appBuilderActionSlots";
import AppBuilderActionSlots from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionSlots";
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
import AppBuilderStackUiWidgetButtonComponent from "./AppBuilderStackUiWidget/AppBuilderStackUiWidgetButtonComponent";
import AppBuilderTableWidgetComponent from "./AppBuilderTableWidgetComponent";
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
				if (React.isValidElement(w)) {
					// JSX widgets (e.g. injected fallback UI) have no JSON actionSlots.
					return <React.Fragment key={i}>{w}</React.Fragment>;
				}

				const widget = w as IAppBuilderWidget;
				const inner = renderAppBuilderWidget(
					widget,
					namespace,
					componentContext,
				);
				if (!inner) return null;

				return (
					<AppBuilderActionSlots
						key={i}
						actionSlots={widget.actionSlots}
						allowedEvents={APP_BUILDER_SLOT_EVENTS.widget}
						namespace={namespace}
					>
						{inner}
					</AppBuilderActionSlots>
				);
			})}
		</>
	);
}

function renderAppBuilderWidget(
	w: IAppBuilderWidget,
	namespace: string,
	componentContext: React.ContextType<typeof ComponentContext>,
) {
	for (const key in componentContext.widgets) {
		const componentDefinition = componentContext.widgets[key];
		if (componentDefinition.isComponent(w)) {
			const Component = componentDefinition.component;
			return <Component namespace={namespace} {...w.props} />;
		}
	}

	if (isTextWidget(w)) return <AppBuilderTextWidgetComponent {...w.props} />;
	if (isImageWidget(w))
		return (
			<AppBuilderImageWidgetComponent
				namespace={namespace}
				{...w.props}
			/>
		);
	if (isAccordionWidget(w))
		return (
			<AppBuilderAccordionWidgetComponent
				namespace={namespace}
				{...w.props}
			/>
		);
	if (isAccordionUiWidget(w))
		return (
			<AppBuilderAccordionUiWidgetComponent
				namespace={namespace}
				{...w.props}
			/>
		);
	if (isStackUiWidget(w))
		return (
			<AppBuilderStackUiWidgetButtonComponent
				namespace={namespace}
				{...w.props}
			/>
		);
	if (isRoundChartWidget(w))
		return <AppBuilderRoundChartWidgetComponent {...w.props} />;
	if (isLineChartWidget(w))
		return <AppBuilderLineChartWidgetComponent {...w.props} />;
	if (isAreaChartWidget(w))
		return <AppBuilderAreaChartWidgetComponent {...w.props} />;
	if (isBarChartWidget(w))
		return <AppBuilderBarChartWidgetComponent {...w.props} />;
	if (isActionsWidget(w))
		return (
			<AppBuilderActionsWidgetComponent
				namespace={namespace}
				{...w.props}
			/>
		);
	if (isControlsWidget(w))
		return (
			<AppBuilderControlsWidgetComponent
				namespace={namespace}
				{...w.props}
			/>
		);
	if (isFormWidget(w))
		return (
			<AppBuilderFormWidgetComponent namespace={namespace} {...w.props} />
		);
	if (isAgentWidget(w))
		return (
			<Suspense
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
	if (isProgressWidget(w))
		return <AppBuilderProgressWidgetComponent {...w.props} />;
	if (isDesktopClientSelectionWidget(w))
		return <AppBuilderDesktopClientSelectionWidgetComponent {...w.props} />;
	if (isDesktopClientOutputsWidget(w))
		return (
			<AppBuilderDesktopClientOutputsWidgetComponent
				namespace={namespace}
				{...w.props}
			/>
		);
	if (isSavedStatesWidget(w))
		return (
			<AppBuilderSavedStatesWidgetComponent
				namespace={namespace}
				{...w.props}
			/>
		);
	if (isTableWidget(w))
		return <AppBuilderTableWidgetComponent {...w.props} />;
	return null;
}
