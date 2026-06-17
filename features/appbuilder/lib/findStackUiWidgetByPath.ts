import {
	IAppBuilderWidget,
	IAppBuilderWidgetPropsStackUi,
	isStackUiWidget,
} from "../config/appbuilder";

/**
 * Resolves live stack UI widget props from the current widget tree.
 *
 * Walks `path` segment by segment: each entry is a stack widget's `name`.
 * At every level, only `stackUi` children of the current container are considered.
 * Used while a stack is open so content updates when `appBuilderData` changes
 * without storing a snapshot of props in navigation state.
 *
 * @param widgets - Widget list at the current tree level (container or parent stack).
 * @param path - Stack names from root to the target, e.g. `["outer", "inner"]`.
 * @returns Props of the stack at the end of `path`, or `undefined` if any segment is missing.
 */
export function findStackUiWidgetByPath(
	widgets: IAppBuilderWidget[] | undefined,
	path: string[],
): IAppBuilderWidgetPropsStackUi | undefined {
	if (!widgets?.length || !path.length) {
		return undefined;
	}

	// Start at the container's top-level widgets; descend into each matched stack.
	let currentWidgets = widgets;
	let result: IAppBuilderWidgetPropsStackUi | undefined;

	for (const name of path) {
		const stack = currentWidgets.find(
			(
				widget,
			): widget is {
				type: "stackUi";
				props: IAppBuilderWidgetPropsStackUi;
			} => isStackUiWidget(widget) && widget.props.name === name,
		);

		if (!stack) {
			// Path segment not found at this level (renamed, removed, or tree not loaded yet).
			return undefined;
		}

		result = stack.props;
		// Next segment, if any, is resolved among this stack's children.
		currentWidgets = stack.props.widgets;
	}

	return result;
}
