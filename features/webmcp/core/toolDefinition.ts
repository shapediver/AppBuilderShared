import type {ZodType} from "@AppBuilderLib/shared/lib/zod";
import type {ToolDeps} from "./deps";

export type ToolResult<T> = T;

export class ToolExecutionError extends Error {
	readonly structuredContent?: Record<string, unknown>;

	constructor(message: string, structuredContent?: Record<string, unknown>) {
		super(message);
		// ES5 emit breaks Error subclass prototype; restore for instanceof.
		Object.setPrototypeOf(this, new.target.prototype);
		this.name = "ToolExecutionError";
		this.structuredContent = structuredContent;
	}
}

export interface ToolDef<TInput, TOutput> {
	readonly name: string;
	readonly description: string;
	readonly inputSchema: ZodType<TInput>;
	readonly outputSchema: ZodType<TOutput>;
	readonly annotations?: {
		readOnlyHint?: boolean;
		untrustedContentHint?: boolean;
	};
	execute: (
		deps: ToolDeps,
		input: TInput,
		signal: AbortSignal,
	) => Promise<TOutput>;
	format: (output: TOutput) => string;
}

export type AnyToolDef = ToolDef<any, any>;
