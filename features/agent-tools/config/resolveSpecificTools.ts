import type {IAppBuilderActionDefinition} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import type {
	IAppBuilderAgent,
	SpecificToolSettings,
} from "@AppBuilderLib/features/appbuilder/config/appbuilderagent";
import type {JsonValue} from "@AppBuilderLib/features/appbuilder/config/jsonValue";
import {Logger} from "@AppBuilderLib/shared/lib/logger";

export type ResolvedSpecificTool = {
	name: string;
	description: string;
	inputSchema: Record<string, JsonValue>;
	actionSequence: IAppBuilderActionDefinition[];
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

/**
 * Specific tools from one agent snapshot.
 * `remoteExecution` is ignored. A name that matches a resolved generic tool is skipped.
 * Duplicate specific names: last entry wins.
 */
export function resolveSpecificTools(
	agent: Pick<IAppBuilderAgent, "specificTools"> | undefined,
	genericNames: readonly string[],
): ResolvedSpecificTool[] {
	const reserved = new Set(genericNames);
	const byName = new Map<string, ResolvedSpecificTool>();
	for (const tool of agent?.specificTools ?? []) {
		if (!tool.name) {
			Logger.warn("Skipping specific tool with an empty name.");
			continue;
		}
		if (reserved.has(tool.name)) {
			Logger.warn(
				`Skipping specific tool "${tool.name}" because a generic tool with that name is registered.`,
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
			actionSequence: tool.actionSequence ?? [],
		});
	}
	return [...byName.values()];
}
