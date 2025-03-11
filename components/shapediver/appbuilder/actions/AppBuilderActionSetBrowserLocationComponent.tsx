import AppBuilderActionComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionComponent";
import {IAppBuilderActionPropsSetBrowserLocation} from "@AppBuilderShared/types/shapediver/appbuilder";
import React, {useCallback} from "react";

type Props = IAppBuilderActionPropsSetBrowserLocation;

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
		target,
	} = props;

	const onClick = useCallback(() => {
		const newLocation = getLocation(href, pathname, search, hash);
		if (target && target !== "_self") {
			window.open(newLocation, target);
		} else if (newLocation !== window.location.href) {
			window.location.href = newLocation;
		}
	}, [href, pathname, search, hash, target]);

	return (
		<AppBuilderActionComponent
			label={label}
			icon={icon}
			tooltip={tooltip}
			onClick={onClick}
		/>
	);
}
