/**
 * Viewer task facts about a session customization. They are plain strings so
 * this module does not import the viewer (tests mock `@shapediver/viewer.session`).
 */

/** Viewer `TASK_TYPE.SESSION_CUSTOMIZATION`. */
export const SESSION_CUSTOMIZATION_TASK_TYPE = "session_customization";

/**
 * Viewer `TASK_CATEGORY.SESSION_CUSTOMIZATION.CUSTOMIZE_PARALLEL`. An
 * instance computation: it changes neither the values nor the scene node of
 * the session.
 */
export const SESSION_CUSTOMIZATION_PARALLEL_CATEGORY = "customize_parallel";

/**
 * `ITaskEvent.status` on `TASK_CANCEL` when a session customize actually
 * failed. Other cancels (superseded customizes) use a different status.
 */
export const SESSION_CUSTOMIZATION_FAILED_STATUS =
	"Session customization failed";

export function isSessionCustomizationFailedTask(event: {
	type?: string;
	status?: string;
}): boolean {
	return (
		event.type === SESSION_CUSTOMIZATION_TASK_TYPE &&
		event.status === SESSION_CUSTOMIZATION_FAILED_STATUS
	);
}

/** Whether the task event belongs to an instance computation. */
export function isSessionCustomizationParallelTask(event: {
	category?: string;
}): boolean {
	return event.category === SESSION_CUSTOMIZATION_PARALLEL_CATEGORY;
}
