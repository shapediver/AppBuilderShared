import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import type {AddToCartActionThemeDefaultProps} from "../config/AddToCartAction.theme.types";
import type {IAppBuilderActionPropsAddToCart} from "../config/appbuilder";

type AddToCartActionThemeDefaultsStore = {
	defaults: AddToCartActionThemeDefaultProps;
	setDefaults: (defaults: AddToCartActionThemeDefaultProps) => void;
};

/**
 * Theme `AddToCartAction` defaults, mirrored from Mantine `useProps`
 * so the headless add-to-cart run can merge them without hooks.
 */
export const useAddToCartActionThemeDefaultsStore =
	create<AddToCartActionThemeDefaultsStore>()(
		devtools(
			(set) => ({
				defaults: {},
				setDefaults: (defaults) =>
					set({defaults}, false, "setDefaults"),
			}),
			{...devtoolsSettings, name: "ShapeDiver | AddToCartActionTheme"},
		),
	);

export function getAddToCartActionThemeDefaults(): AddToCartActionThemeDefaultProps {
	return useAddToCartActionThemeDefaultsStore.getState().defaults;
}

export function applyAddToCartActionThemeDefaults(props: {
	screenshotProps?: IAppBuilderActionPropsAddToCart["screenshotProps"];
	successMessage?: string;
	errorMessage?: string;
}): {
	screenshotProps?: IAppBuilderActionPropsAddToCart["screenshotProps"];
	successMessage?: string;
	errorMessage?: string;
} {
	const theme = getAddToCartActionThemeDefaults();
	return {
		screenshotProps:
			props.screenshotProps ??
			(theme.screenshotProps as
				| IAppBuilderActionPropsAddToCart["screenshotProps"]
				| undefined),
		successMessage: props.successMessage ?? theme.successMessage,
		errorMessage: props.errorMessage ?? theme.errorMessage,
	};
}
