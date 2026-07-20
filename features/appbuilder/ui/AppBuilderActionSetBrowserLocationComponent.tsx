import {useCreateModelState} from "@AppBuilderLib/features/model-state/model/useCreateModelState";
import {QUERYPARAM_MODELSTATEID} from "@AppBuilderLib/shared/config/queryparams";
import {applyModelStateToUrl} from "@AppBuilderLib/shared/lib/modifyUrl";
import {useCallback, useState} from "react";
import {IAppBuilderLegacyActionPropsSetBrowserLocation} from "../config/appbuilder";
import AppBuilderActionBase, {
	AppBuilderActionRenderProps,
} from "./AppBuilderActionBase";

type Props = IAppBuilderLegacyActionPropsSetBrowserLocation &
	AppBuilderActionRenderProps & {
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
		presentation,
		toolbarButtonProps,
		disabled,
	} = props;

	const {createModelState} = useCreateModelState({namespace});
	const [loading, setLoading] = useState(false);

	const onClick = useCallback(async () => {
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

	return (
		<AppBuilderActionBase
			presentation={presentation}
			label={label}
			icon={icon}
			tooltip={tooltip}
			loading={loading}
			onClick={onClick}
			disabled={disabled}
			toolbarButtonProps={toolbarButtonProps}
		/>
	);
}
