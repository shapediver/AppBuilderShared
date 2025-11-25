import {
	QUERYPARAM_MODELSTATEID,
	QUERYPARAM_SAVEDSTATEID,
} from "@AppBuilderShared/types/shapediver/queryparams";

/**
 * Apply a model state id to the current URL as a query parameter.
 * @param modelStateId The model state id to apply to the URL, if not provided or null, it will be removed instead
 * @param updateUrl If true, the browser URL will be updated using the History API
 * @returns
 */
export function applyModelStateToUrl(
	modelStateId?: string | null,
	updateUrl: boolean = true,
) {
	if (!modelStateId) return removeStatesFromUrl(true, false, updateUrl);

	const url = new URL(window.location.href);
	url.searchParams.set(QUERYPARAM_MODELSTATEID, modelStateId);

	// if there is currently a saved state id in the URL, remove it
	if (url.searchParams.has(QUERYPARAM_SAVEDSTATEID))
		url.searchParams.delete(QUERYPARAM_SAVEDSTATEID);

	if (updateUrl) window.history.replaceState({}, "", url.toString());
	return url;
}

/**
 * Apply a saved state id to the current URL as a query parameter.
 * @param savedStateId The saved state id to apply to the URL, if not provided or null, it will be removed instead
 * @param updateUrl If true, the browser URL will be updated using the History API
 * @returns
 */
export function applySavedStateToUrl(
	savedStateId?: string | null,
	updateUrl: boolean = true,
) {
	if (!savedStateId) return removeStatesFromUrl(false, true, updateUrl);

	const url = new URL(window.location.href);
	url.searchParams.set(QUERYPARAM_SAVEDSTATEID, savedStateId);

	// if there is currently a model state id in the URL, remove it
	if (url.searchParams.has(QUERYPARAM_MODELSTATEID))
		url.searchParams.delete(QUERYPARAM_MODELSTATEID);

	if (updateUrl) window.history.replaceState({}, "", url.toString());
	return url;
}

/**
 * Remove model state id and/or saved state id from the current URL.
 * @param modelStateId If true, the model state id will be removed from the URL
 * @param savedStateId If true, the saved state id will be removed from the URL
 * @param updateUrl If true, the browser URL will be updated using the History API
 * @returns
 */
export function removeStatesFromUrl(
	modelStateId: boolean = true,
	savedStateId: boolean = true,
	updateUrl: boolean = true,
) {
	const url = new URL(window.location.href);
	if (modelStateId && url.searchParams.has(QUERYPARAM_MODELSTATEID))
		url.searchParams.delete(QUERYPARAM_MODELSTATEID);
	if (savedStateId && url.searchParams.has(QUERYPARAM_SAVEDSTATEID))
		url.searchParams.delete(QUERYPARAM_SAVEDSTATEID);
	if (updateUrl) window.history.replaceState({}, "", url.toString());
	return url;
}
