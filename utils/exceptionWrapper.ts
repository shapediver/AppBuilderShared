type ExceptionWrapperReturnType<T> =
	| {
			data: T;
			error?: never;
	  }
	| {
			data?: never;
			error: Error;
	  };

/**
 * Wraps a function call in a try-catch block to handle exceptions.
 * Use this to simplify code for precisely handling exceptions.
 * @param fn
 * @returns
 */
export function exceptionWrapper<T>(
	fn: () => T,
	fin?: () => void,
): ExceptionWrapperReturnType<T> {
	let data: T;
	try {
		data = fn();
	} catch (error) {
		return {
			error: error instanceof Error ? error : new Error("" + error),
		};
	} finally {
		fin?.();
	}
	return {data};
}

/**
 * Wraps an async function call in a try-catch block to handle exceptions.
 * Use this to simplify code for precisely handling exceptions.
 * @param fn
 * @returns
 */
export async function exceptionWrapperAsync<T>(
	fn: () => Promise<T>,
	fin?: () => void,
): Promise<ExceptionWrapperReturnType<T>> {
	let data: T;
	try {
		data = await fn();
	} catch (error) {
		return {
			error: error instanceof Error ? error : new Error("" + error),
		};
	} finally {
		fin?.();
	}
	return {data};
}
