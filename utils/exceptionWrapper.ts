/**
 * Wraps a function call in a try-catch block to handle exceptions.
 * Use this to simplify code for precisely handling exceptions.
 * @param fn
 * @returns
 */
export function exceptionWrapper<T>(fn: () => T): {
	result: T | null;
	error: Error | null;
} {
	let result: T;
	try {
		result = fn();
	} catch (error) {
		return {
			error: error instanceof Error ? error : new Error("" + error),
			result: null,
		};
	}
	return {result, error: null};
}

/**
 * Wraps an async function call in a try-catch block to handle exceptions.
 * Use this to simplify code for precisely handling exceptions.
 * @param fn
 * @returns
 */
export async function exceptionWrapperAsync<T>(fn: () => Promise<T>): Promise<{
	result: T | null;
	error: Error | null;
}> {
	let result: T;
	try {
		result = await fn();
	} catch (error) {
		return {
			error: error instanceof Error ? error : new Error("" + error),
			result: null,
		};
	}
	return {result, error: null};
}
