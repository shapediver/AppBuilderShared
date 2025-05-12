import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {useCreateModelState} from "@AppBuilderShared/hooks/shapediver/useCreateModelState";
import {IAppBuilderActionPropsSetBrowserLocation} from "@AppBuilderShared/types/shapediver/appbuilder";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderShared/types/shapediver/queryparams";
import React, {useCallback, useState} from "react";

type Props = IAppBuilderActionPropsSetBrowserLocation & {
	namespace: string;
};

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

/**
 * Functional component for a "setBrowserLocation" action.
 *
 * @returns
 */
export default function AppBuilderActionSetBrowserLocationComponent(
	props: Props,
) {
	const {
		label = "Set location",
		icon,
		tooltip,
		href,
		pathname,
		search,
		hash,
		namespace,
		target,
	} = props;

	const {createModelState} = useCreateModelState({namespace});
	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
		let newLocation = getLocation(href, pathname, search, hash);

		// check if newLocation contains a URL parameter called "modelStateId"
		const newLocationUrl = new URL(newLocation);
		if (newLocationUrl.searchParams.has(QUERYPARAM_MODELSTATEID)) {
			setLoading(true);

			const {modelStateId} = await createModelState(
				undefined, // <-- use parameter values of the session
				false, // <-- use parameter values of the session
				true, // <-- includeImage,
				undefined, // <-- custom data
				false, // <-- includeGltf,
			);

			// replace the value of the URL parameter "modelStateId" with the new value
			if (modelStateId) {
				newLocationUrl.searchParams.set(
					QUERYPARAM_MODELSTATEID,
					modelStateId,
				);
				newLocation = newLocationUrl.toString();
			}

			setLoading(false);
		}

		if (target && target !== "_self") {
			window.open(newLocation, target);
		} else if (newLocation !== window.location.href) {
			window.location.href = newLocation;
		}
	}, [createModelState, href, pathname, search, hash, target]);

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			loading={loading}
			onClick={onClick}
		/>
	);
}
