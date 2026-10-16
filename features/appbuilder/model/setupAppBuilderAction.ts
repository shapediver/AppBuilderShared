import {
	type AppBuilderActionRunRegistration,
	type AppBuilderActionSetupContext,
	findAppBuilderActionRegistration,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {
	type IAppBuilderActionDefinition,
	isExecuteActionsAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {defaultAppBuilderActionRuns} from "./appBuilderActionCatalog";

/**
 * Run an action's mount registration. Nested `executeActions` definitions
 * forward the same button. The caller does not need to know which actions
 * have a setup.
 */
export function setupAppBuilderAction(
	definition: IAppBuilderActionDefinition,
	context: AppBuilderActionSetupContext,
	hostActions?: Record<string, AppBuilderActionRunRegistration | undefined>,
): (() => void) | void {
	if (isExecuteActionsAction(definition)) {
		const cleanups: Array<() => void> = [];
		for (const action of definition.props.actions) {
			const cleanup = setupAppBuilderAction(action, context, hostActions);
			if (cleanup) cleanups.push(cleanup);
		}
		return () => {
			for (const cleanup of cleanups) cleanup();
		};
	}

	const entry = findAppBuilderActionRegistration(
		definition,
		defaultAppBuilderActionRuns,
		hostActions,
	);
	return entry?.setup?.(definition, context);
}
