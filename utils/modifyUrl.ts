import {
	QUERYPARAM_MODELSTATEID,
	QUERYPARAM_SAVEDSTATEID,
} from "@AppBuilderShared/types/shapediver/queryparams";

/**
 * Custom event name for URL changes made via modifyUrl functions.
 * Listen to this event to detect programmatic URL changes (pushState/replaceState don't fire popstate).
 */
export const URL_CHANGED_EVENT = "urlchanged";

/**
 * Dispatches a custom event to notify listeners that the URL has changed.
 */
function dispatchUrlChangedEvent() {
	window.dispatchEvent(new CustomEvent(URL_CHANGED_EVENT));
}

/**
 * Apply a model state id to the current URL as a query parameter.
 * @param modelStateId The model state id to apply to the URL, if not provided or null, it will be removed instead
 * @param updateUrl If true, the browser URL will be updated using the History API
 * @param initialUrl The initial URL to modify, if not provided the current window location will be used
 * @returns
 */
export function applyModelStateToUrl(
	modelStateId?: string | null,
	updateUrl: boolean = true,
	initialUrl?: URL,
) {
	if (!modelStateId)
		return removeStatesFromUrl(true, false, updateUrl, initialUrl);

	const url = initialUrl ?? new URL(window.location.href);
	url.searchParams.set(QUERYPARAM_MODELSTATEID, modelStateId);

	// if there is currently a saved state id in the URL, remove it
	if (url.searchParams.has(QUERYPARAM_SAVEDSTATEID))
		url.searchParams.delete(QUERYPARAM_SAVEDSTATEID);

	if (updateUrl) {
		window.history.replaceState({}, "", url.toString());
		dispatchUrlChangedEvent();
	}
	return url;
}

/**
 * Apply a saved state id to the current URL as a query parameter.
 * @param savedStateId The saved state id to apply to the URL, if not provided or null, it will be removed instead
 * @param updateUrl If true, the browser URL will be updated using the History API
 * @param initialUrl The initial URL to modify, if not provided the current window location will be used
 * @returns
 */
export function applySavedStateToUrl(
	savedStateId?: string | null,
	updateUrl: boolean = true,
	initialUrl?: URL,
) {
	if (!savedStateId)
		return removeStatesFromUrl(false, true, updateUrl, initialUrl);

	const url = initialUrl ?? new URL(window.location.href);
	url.searchParams.set(QUERYPARAM_SAVEDSTATEID, savedStateId);

	// if there is currently a model state id in the URL, remove it
	if (url.searchParams.has(QUERYPARAM_MODELSTATEID))
		url.searchParams.delete(QUERYPARAM_MODELSTATEID);

	if (updateUrl) {
		window.history.replaceState({}, "", url.toString());
		dispatchUrlChangedEvent();
	}
	return url;
}

/**
 * Remove model state id and/or saved state id from the current URL.
 * @param modelStateId If true, the model state id will be removed from the URL
 * @param savedStateId If true, the saved state id will be removed from the URL
 * @param updateUrl If true, the browser URL will be updated using the History API
 * @param initialUrl The initial URL to modify, if not provided the current window location will be used
 * @returns
 */
export function removeStatesFromUrl(
	modelStateId: boolean = true,
	savedStateId: boolean = true,
	updateUrl: boolean = true,
	initialUrl?: URL,
) {
	const url = initialUrl ?? new URL(window.location.href);
	if (modelStateId && url.searchParams.has(QUERYPARAM_MODELSTATEID))
		url.searchParams.delete(QUERYPARAM_MODELSTATEID);
	if (savedStateId && url.searchParams.has(QUERYPARAM_SAVEDSTATEID))
		url.searchParams.delete(QUERYPARAM_SAVEDSTATEID);
	if (updateUrl) {
		window.history.replaceState({}, "", url.toString());
		dispatchUrlChangedEvent();
	}
	return url;
}
