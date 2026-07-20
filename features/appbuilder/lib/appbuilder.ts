import {
	IAppBuilder,
	IAppBuilderParameterRef,
	isAccordionWidget,
} from "../config/appbuilder";

/**
 * Given an App Builder data object, return all parameter references
 * occuring in any of the accordion widgets.
 * @param data
 * @returns
 */
export function getParameterRefs(data: IAppBuilder): IAppBuilderParameterRef[] {
	return data.containers.reduce((acc, container) => {
		if ("widgets" in container && container.widgets) {
			container.widgets.forEach((widget) => {
				if (isAccordionWidget(widget) && widget.props.parameters) {
					acc.push(...widget.props.parameters);
				}
			});
		}
		if ("tabs" in container && container.tabs) {
			container.tabs.forEach((tab) => {
				tab.widgets.forEach((widget) => {
					if (isAccordionWidget(widget) && widget.props.parameters) {
						acc.push(...widget.props.parameters);
					}
				});
			});
		}
		return acc;
	}, [] as IAppBuilderParameterRef[]);
}
