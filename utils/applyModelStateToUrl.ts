import {QUERYPARAM_MODELSTATEID} from "@AppBuilderShared/types/shapediver/queryparams";

/**
 * Apply a model state id to the current URL as a query parameter.
 * @param modelStateId The model state id to apply to the URL
 * @param updateUrl If true, the browser URL will be updated using the History API
 * @returns
 */
export function applyModelStateToUrl(
	modelStateId: string,
	updateUrl: boolean = true,
) {
	const url = new URL(window.location.href);
	url.searchParams.set(QUERYPARAM_MODELSTATEID, modelStateId);
	if (updateUrl) window.history.replaceState({}, "", url.toString());
	return url;
}
