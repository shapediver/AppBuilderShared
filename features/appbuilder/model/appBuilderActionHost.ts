import type {AppBuilderActionHost} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";

/**
 * Toolbar click recorded by the shared action button and taken by the
 * action that runs. Cleared when the click handler returns. The runner
 * keeps its own copy for the rest of the sequence.
 */
let notedActionHost: Omit<AppBuilderActionHost, "actions"> | null = null;

export function noteActionHost(
	host: Omit<AppBuilderActionHost, "actions">,
): void {
	notedActionHost = host;
}

export function consumeActionHost(): Omit<
	AppBuilderActionHost,
	"actions"
> | null {
	const host = notedActionHost;
	notedActionHost = null;
	return host;
}

export function clearActionHost(): void {
	notedActionHost = null;
}
