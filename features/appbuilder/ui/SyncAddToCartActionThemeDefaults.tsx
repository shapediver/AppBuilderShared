import {useAddToCartActionThemeDefaultsStore} from "@AppBuilderLib/features/appbuilder/model/addToCartActionThemeDefaults";
import {useProps} from "@mantine/core";
import {useEffect} from "react";

const emptyThemeProps = {};

/** Keep headless add-to-cart in sync with Mantine `AddToCartAction` defaults. */
export function SyncAddToCartActionThemeDefaults() {
	const defaults = useProps(
		"AddToCartAction",
		emptyThemeProps,
		emptyThemeProps,
	);
	useEffect(() => {
		useAddToCartActionThemeDefaultsStore.getState().setDefaults(defaults);
	}, [defaults]);
	return null;
}
