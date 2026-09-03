import {formatToolInputError} from "./formatToolInputError";

/** Parse `input` with `schema`, then `onOk`. Zod/throw → `onError(message)`. Caller owns the envelope. */
export async function runParsedTool<TParsed, TOut>(
	schema: {parse: (data: unknown) => TParsed},
	input: unknown,
	onOk: (parsed: TParsed) => Promise<TOut> | TOut,
	onError: (message: string) => TOut,
): Promise<TOut> {
	try {
		return await onOk(schema.parse(input));
	} catch (e) {
		return onError(formatToolInputError(e).errors[0].message);
	}
}
