import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderLib/shared/config/queryparams";
import {applyModelStateToUrl} from "@AppBuilderLib/shared/lib/modifyUrl";
import {useCallback, useState} from "react";
import {IAppBuilderActionPropsSetBrowserLocation} from "../config/appbuilder";

export interface UseAppBuilderActionSetBrowserLocationProps extends IAppBuilderActionPropsSetBrowserLocation {
	namespace: string;
	disabled?: boolean;
}

function getLocation(
	href?: string,
	pathname?: string,
	search?: string,
	hash?: string,
): string {
	if (href) return href;

	const currentLocation = window.location;

	if (pathname)
		return `${currentLocation.origin}${pathname.startsWith("/") ? pathname : "/" + pathname}`;

	if (search)
		return `${currentLocation.origin}${currentLocation.pathname}${search.startsWith("?") ? search : "?" + search}`;

	if (hash)
		return `${currentLocation.origin}${currentLocation.pathname}${currentLocation.search}${hash.startsWith("#") ? hash : "#" + hash}`;

	return currentLocation.href;
}

/** Logic for the "setBrowserLocation" action. Can be used without the action component. */
export function useAppBuilderActionSetBrowserLocation(
	props: UseAppBuilderActionSetBrowserLocationProps,
) {
	const {href, pathname, search, hash, namespace, target, disabled} = props;
	const {createModelState} = useCreateModelState({namespace});
	const [loading, setLoading] = useState(false);

	const trigger = useCallback(async () => {
		let newLocation = getLocation(href, pathname, search, hash);

		// check if newLocation contains a URL parameter called "modelStateId"
		const newLocationUrl = new URL(newLocation);
		if (newLocationUrl.searchParams.has(QUERYPARAM_MODELSTATEID)) {
			setLoading(true);

			const {modelStateId} = await createModelState({
				parameterNamesToInclude: undefined, // <-- parameterNamesToInclude: use default according to the theme
				parameterNamesToExclude: undefined, // <-- parameterNamesToExclude: use default according to the theme
				includeImage: true, // <-- includeImage,
				image: undefined,
				data: undefined, // <-- custom data
				includeGltf: false, // <-- includeGltf,
			});

			// replace the value of the URL parameter "modelStateId" with the new value
			newLocation = applyModelStateToUrl(
				modelStateId,
				false,
				newLocationUrl,
			).toString();

			setLoading(false);
		}

		if (target && target !== "_self") {
			window.open(newLocation, target);
		} else if (newLocation !== window.location.href) {
			window.location.href = newLocation;
		}
	}, [createModelState, href, pathname, search, hash, target]);

	return {
		trigger,
		disabled,
		loading,
	};
}
