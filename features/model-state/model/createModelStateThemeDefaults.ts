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
 * so headless create-model-state can merge them without hooks.
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

/**
 * Last-step screenshot default matching {@link useCreateModelState}:
 * callers that already merged action / AddToCartAction screenshot win;
 * otherwise use CreateModelStateHook.screenshotProps.
 */
export function applyCreateModelStateScreenshotFallback(
	screenshotProps?: ICreateModelStateData["screenshotProps"],
): ICreateModelStateData["screenshotProps"] {
	return (
		screenshotProps ?? getCreateModelStateThemeDefaults().screenshotProps
	);
}

export function applyCreateModelStateFilterDefaults(
	props: ICreateModelStateData,
): {
	parameterNamesToAlwaysExclude: string[];
	props: ICreateModelStateData;
} {
	const theme = getCreateModelStateThemeDefaults();
	return {
		parameterNamesToAlwaysExclude:
			theme.parameterNamesToAlwaysExclude ?? [],
		props: {
			...props,
			parameterNamesToInclude:
				props.parameterNamesToInclude ?? theme.parameterNamesToInclude,
			parameterNamesToExclude:
				props.parameterNamesToExclude ?? theme.parameterNamesToExclude,
		},
	};
}

export function applyCreateModelStateThemeDefaults(
	props: ICreateModelStateData & {
		successMessage?: string;
		errorMessage?: string;
	},
): {
	parameterNamesToAlwaysExclude: string[];
	props: ICreateModelStateData;
	successMessage?: string;
	errorMessage?: string;
} {
	const theme = getCreateModelStateThemeDefaults();
	const {successMessage, errorMessage, ...stateProps} = props;
	const filtered = applyCreateModelStateFilterDefaults(stateProps);
	return {
		...filtered,
		props: {
			...filtered.props,
			screenshotProps: applyCreateModelStateScreenshotFallback(
				props.screenshotProps,
			),
		},
		successMessage: successMessage ?? theme.successMessage,
		errorMessage: errorMessage ?? theme.errorMessage,
	};
}
