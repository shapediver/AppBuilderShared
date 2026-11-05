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
 * Selects and deselects nodes of the mounted interaction parameters with a
 * selection (selection, gumball, rectangle transform). The parameter which
 * owns a node changes its selection like a user selection does, see
 * `applySelectionAction`.
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
