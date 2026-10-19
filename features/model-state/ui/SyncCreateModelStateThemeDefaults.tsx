import {useCreateModelStateThemeDefaultsStore} from "@AppBuilderLib/features/model-state/model/createModelStateThemeDefaults";
import {useProps} from "@mantine/core";
import {useEffect} from "react";

const emptyThemeProps = {};

/** Keep headless create-model-state in sync with Mantine `CreateModelStateHook` defaults. */
export function SyncCreateModelStateThemeDefaults() {
	const defaults = useProps(
		"CreateModelStateHook",
		emptyThemeProps,
		emptyThemeProps,
	);
	useEffect(() => {
		useCreateModelStateThemeDefaultsStore.getState().setDefaults(defaults);
	}, [defaults]);
	return null;
}
