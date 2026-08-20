import {formatToolInputError} from "./formatToolInputError";

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
