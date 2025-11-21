import {useCallback, useEffect, useRef, useState} from "react";

/**
 * The useAsync hook takes in a callback function that performs the asynchronous operation and an
 * optional array of dependencies. It returns an object with three properties: loading, error, and value.
 * The loading property indicates whether the operation is currently in progress, while the error
 * property holds any error messages encountered during the process.
 * Finally, the value property contains the resolved value of the asynchronous operation.
 *
 * @see https://github.com/sergeyleschev/react-custom-hooks
 *
 * @param callback
 * @param dependencies
 * @param events
 * @param events.onLoading
 * @param events.onError
 * @param events.onSuccess
 * @returns
 */
export default function useAsync<T>(
	callback: () => Promise<T>,
	dependencies: React.DependencyList = [],
	events: {
		onLoading?: () => void;
		onError?: (error: any) => void;
		onSuccess?: (value: T) => void;
	} = {},
) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | undefined>();
	const [value, setValue] = useState<T | undefined>();

	const promiseChain = useRef(Promise.resolve());

	const callbackMemoized = useCallback(() => {
		events.onLoading?.();
		setLoading(true);
		setError(undefined);
		setValue(undefined);

		return callback()
			.then((value) => {
				events.onSuccess?.(value);
				setValue(value);
			})
			.catch((error) => {
				events.onError?.(error);
				setError(error);
			})
			.finally(() => setLoading(false));
	}, dependencies);

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(callbackMemoized);
	}, [callbackMemoized]);

	return {loading, error, value};
}
