import {devtoolsSettings} from "@AppBuilderLib/shared/config/storeSettings";
import {create} from "zustand";
import {devtools} from "zustand/middleware";
import type {ICreateModelStateData} from "../config/createModelState";
import type {CreateModelStateHookThemeDefaultProps} from "./useCreateModelState.types";

type CreateModelStateThemeDefaultsStore = {
	defaults: CreateModelStateHookThemeDefaultProps;
	setDefaults: (defaults: CreateModelStateHookThemeDefaultProps) => void;
};

/**
 * Theme `CreateModelStateHook` defaults, mirrored from Mantine `useProps`
 * so headless create-model-state / add-to-cart can merge them without hooks.
 */
export const useCreateModelStateThemeDefaultsStore =
	create<CreateModelStateThemeDefaultsStore>()(
		devtools(
			(set) => ({
				defaults: {},
				setDefaults: (defaults) =>
					set({defaults}, false, "setDefaults"),
			}),
			{...devtoolsSettings, name: "ShapeDiver | CreateModelStateTheme"},
		),
	);

export function getCreateModelStateThemeDefaults(): CreateModelStateHookThemeDefaultProps {
	return useCreateModelStateThemeDefaultsStore.getState().defaults;
}

export function applyCreateModelStateThemeDefaults(props: {
	includeImage?: boolean;
	image?: ICreateModelStateData["image"];
	includeGltf?: boolean;
	screenshotProps?: ICreateModelStateData["screenshotProps"];
	parameterNamesToInclude?: string[];
	parameterNamesToExclude?: string[];
	successMessage?: string;
	errorMessage?: string;
}): {
	parameterNamesToAlwaysExclude: string[];
	props: ICreateModelStateData;
	successMessage?: string;
	errorMessage?: string;
} {
	const theme = getCreateModelStateThemeDefaults();
	return {
		parameterNamesToAlwaysExclude:
			theme.parameterNamesToAlwaysExclude ?? [],
		props: {
			includeImage: props.includeImage,
			image: props.image,
			includeGltf: props.includeGltf,
			screenshotProps: props.screenshotProps ?? theme.screenshotProps,
			parameterNamesToInclude:
				props.parameterNamesToInclude ?? theme.parameterNamesToInclude,
			parameterNamesToExclude:
				props.parameterNamesToExclude ?? theme.parameterNamesToExclude,
		},
		successMessage: props.successMessage ?? theme.successMessage,
		errorMessage: props.errorMessage ?? theme.errorMessage,
	};
}
