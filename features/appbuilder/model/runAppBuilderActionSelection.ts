import {applySelectionAction} from "@AppBuilderLib/entities/parameter/model/interaction/selectionActionRegistry";
import type {IAppBuilderActionPropsSelection} from "@AppBuilderLib/features/appbuilder/config/appbuilder";

export type AppBuilderActionRunSelectionContext = {
	namespace: string;
	/** Throw if the parameter of the action does not exist. */
	strict?: boolean;
};

/**
 * Headless "selection" trigger.
 *
 * Without `parameter`, changes the root scene selection of the `selecton` /
 * `selectoff` groups whose candidates match. With `parameter`, changes that
 * one mounted interaction parameter (selection, gumball, rectangle transform)
 * the way a user selection does. See `applySelectionAction`.
 */
export function runAppBuilderActionSelection(
	props: IAppBuilderActionPropsSelection,
	context: AppBuilderActionRunSelectionContext,
): void {
	applySelectionAction(props, {
		namespace: context.namespace,
		strict: context.strict,
	});
}
