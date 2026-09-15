import {
	IAppBuilderActionDefinition,
	isExecuteActionsAction,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {AppBuilderActionRunContext} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {findAppBuilderActionRegistration} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {defaultAppBuilderActionRuns} from "./appBuilderActionCatalog";
import {waitForAppBuilderSessionIdle} from "./waitForAppBuilderSessionIdle";

export {
	DEFAULT_APP_BUILDER_ACTION_FULLSCREEN_ID,
	DEFAULT_APP_BUILDER_ACTION_VIEWPORT_ID,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
export type {AppBuilderActionRunContext} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";

/**
 * Run a single App Builder action without mounting its UI component.
 * Nested `executeActions` definitions recurse (not in the run catalog, to
 * avoid a circular import). Viewer-specific actions (camera, AR, fullscreen)
 * only run when the host registered them on `componentContext.actions`.
 */
export async function runAppBuilderAction(
	definition: IAppBuilderActionDefinition,
	context: AppBuilderActionRunContext,
): Promise<void> {
	const entry = findAppBuilderActionRegistration(
		definition,
		defaultAppBuilderActionRuns,
		context.hostActions,
	);
	if (entry) {
		await entry.run?.(definition, context);
		return;
	}

	if (isExecuteActionsAction(definition)) {
		await runAppBuilderActions(
			definition.props.actions,
			definition.props.mode ?? "parallel",
			context,
		);
		return;
	}

	Logger.warn(
		`executeActions has no headless runner for action type "${definition.type}".`,
	);
}

/**
 * Run nested actions in parallel or in sequence.
 * Sequential mode waits for session work after each action.
 */
export async function runAppBuilderActions(
	actions: IAppBuilderActionDefinition[],
	mode: "parallel" | "sequential" = "parallel",
	context: AppBuilderActionRunContext,
): Promise<void> {
	if (mode === "sequential") {
		for (const action of actions) {
			await runAppBuilderAction(action, context);
			await waitForAppBuilderSessionIdle();
		}
		return;
	}

	const results = await Promise.allSettled(
		actions.map((action) => runAppBuilderAction(action, context)),
	);
	await waitForAppBuilderSessionIdle();
	const rejected = results.find((result) => result.status === "rejected");
	if (rejected?.status === "rejected") {
		throw rejected.reason;
	}
}
