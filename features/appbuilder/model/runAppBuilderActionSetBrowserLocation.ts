import {IAppBuilderActionPropsSetBrowserLocation} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import {
	AppBuilderActionRunContext,
	resolvedViewportId,
} from "@AppBuilderLib/features/appbuilder/config/appBuilderActionRun";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderLib/shared/config/queryparams";
import {applyModelStateToUrl} from "@AppBuilderLib/shared/lib/modifyUrl";
import {createModelStateFromStores} from "./runAppBuilderActionCreateModelState";

function getBrowserLocation(
	props: IAppBuilderActionPropsSetBrowserLocation,
): string {
	if (props.href) return props.href;
	const currentLocation = window.location;
	if (props.pathname)
		return `${currentLocation.origin}${props.pathname.startsWith("/") ? props.pathname : "/" + props.pathname}`;
	if (props.search)
		return `${currentLocation.origin}${currentLocation.pathname}${props.search.startsWith("?") ? props.search : "?" + props.search}`;
	if (props.hash)
		return `${currentLocation.origin}${currentLocation.pathname}${currentLocation.search}${props.hash.startsWith("#") ? props.hash : "#" + props.hash}`;
	return currentLocation.href;
}

/** Navigate or open a URL, optionally injecting a new model state id. */
export async function runAppBuilderActionSetBrowserLocation(
	props: IAppBuilderActionPropsSetBrowserLocation,
	context: AppBuilderActionRunContext,
): Promise<void> {
	let newLocation = getBrowserLocation(props);
	const newLocationUrl = new URL(newLocation);
	if (newLocationUrl.searchParams.has(QUERYPARAM_MODELSTATEID)) {
		const {modelStateId} = await createModelStateFromStores(
			context.namespace,
			resolvedViewportId(context),
			{includeImage: true, includeGltf: false},
		);
		newLocation = applyModelStateToUrl(
			modelStateId,
			false,
			newLocationUrl,
		).toString();
	}
	const target = props.target;
	if (target && target !== "_self") window.open(newLocation, target);
	else if (newLocation !== window.location.href)
		window.location.href = newLocation;
}
