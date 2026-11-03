import {validateNumberParameterSettings} from "@AppBuilderLib/features/appbuilder/config/appbuildertypecheck";
import {useNotificationStore} from "@AppBuilderLib/features/notifications/model/useNotificationStore";
import {useEffect, useMemo} from "react";
import {IShapeDiverParameterDefinition} from "../config/parameter";
import {narrowSliderBounds} from "../lib/numericSliderValue";

/**
 * Validates number parameter settings and derives slider-only min/max bounds
 * (settings may narrow the range; invalid overrides are clamped and reported).
 */
export function useSettingsMinMax(definition: IShapeDiverParameterDefinition) {
	const validatedSettings = useMemo(
		() => validateNumberParameterSettings(definition?.settings),
		[definition],
	);

	const notifications = useNotificationStore();

	const defMin = +definition.min!;
	const defMax = +definition.max!;
	const settingsMin = validatedSettings.success
		? validatedSettings.data.min
		: undefined;
	const settingsMax = validatedSettings.success
		? validatedSettings.data.max
		: undefined;

	const {min: effectiveMin, max: effectiveMax} = useMemo(
		() => narrowSliderBounds(defMin, defMax, settingsMin, settingsMax),
		[defMin, defMax, settingsMin, settingsMax],
	);

	useEffect(() => {
		if (settingsMin !== undefined && settingsMin < defMin) {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Min override (${settingsMin}) is below the parameter minimum (${defMin}) for "${definition.name}", clamping to parameter minimum.`,
			});
		}
		if (settingsMax !== undefined && settingsMax > defMax) {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Max override (${settingsMax}) exceeds the parameter maximum (${defMax}) for "${definition.name}", clamping to parameter maximum.`,
			});
		}
		const clampedMin =
			settingsMin !== undefined ? Math.max(defMin, settingsMin) : defMin;
		const clampedMax =
			settingsMax !== undefined ? Math.min(defMax, settingsMax) : defMax;
		if (clampedMin > clampedMax) {
			notifications.error({
				title: "Invalid Parameter Settings",
				message: `Min override exceeds max override for "${definition.name}".`,
			});
		}
	}, [
		settingsMin,
		settingsMax,
		defMin,
		defMax,
		definition.name,
		notifications,
	]);

	return {
		validatedSettings,
		min: effectiveMin,
		max: effectiveMax,
	};
}
