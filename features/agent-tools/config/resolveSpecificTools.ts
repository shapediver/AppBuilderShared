import {
	GenericToolName,
	type IAppBuilderAgent,
	type SpecificToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import type {JsonValue} from "@AppBuilderLib/features/appbuilder/config/jsonValue";
import {Logger} from "@AppBuilderLib/shared/lib/logger";

export type ResolvedSpecificTool = {
	name: string;
	description: string;
	inputSchema: Record<string, JsonValue>;
	action?: NonNullable<SpecificToolSettings["action"]>;
};

/** Resolved specific tool plus the runner closed over live session deps. */
export type ExecutableSpecificTool = ResolvedSpecificTool & {
	execute: (input: unknown) => Promise<{success: boolean; message?: string}>;
};

function isInputSchema(
	value: SpecificToolSettings["inputSchema"],
): value is Record<string, JsonValue> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Every generic tool name, including ones App Builder does not run. */
const RESERVED_TOOL_NAMES: ReadonlySet<string> = new Set(
	Object.values(GenericToolName),
);

/**
 * Specific tools from one agent snapshot.
 * `remoteExecution` is ignored. A name that matches any {@link GenericToolName}
 * is skipped, even when that generic tool is disabled or not run by App Builder
 * (`ask_user_question`, `get_metric`).
 * Duplicate specific names: last entry wins.
 */
export function resolveSpecificTools(
	agent: Pick<IAppBuilderAgent, "specificTools"> | undefined,
): ResolvedSpecificTool[] {
	const byName = new Map<string, ResolvedSpecificTool>();
	// The agent config is not validated at runtime: ignore a non-array value.
	const listed: unknown = agent?.specificTools;
	for (const tool of Array.isArray(listed)
		? (listed as SpecificToolSettings[])
		: []) {
		if (!tool?.name) {
			Logger.warn("Skipping specific tool with an empty name.");
			continue;
		}
		if (RESERVED_TOOL_NAMES.has(tool.name)) {
			Logger.warn(
				`Skipping specific tool "${tool.name}" because it is a generic tool name.`,
			);
			continue;
		}
		if (!isInputSchema(tool.inputSchema)) {
			Logger.warn(
				`Skipping specific tool "${tool.name}" because inputSchema is not an object.`,
			);
			continue;
		}
		byName.set(tool.name, {
			name: tool.name,
			description: tool.description ?? tool.name,
			inputSchema: tool.inputSchema,
			...(tool.action ? {action: tool.action} : {}),
		});
	}
	return [...byName.values()];
}
