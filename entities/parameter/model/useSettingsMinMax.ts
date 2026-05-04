import {IShapeDiverParameterDefinition} from "../config/parameter";
import {validateNumberParameterSettings} from "@AppBuilderLib/features/appbuilder";
import {useNotificationStore} from "@AppBuilderLib/features/notifications";
import {useEffect, useMemo} from "react";

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

	const {effectiveMin, effectiveMax} = useMemo(() => {
		let clampedMin =
			settingsMin !== undefined
				? Math.min(defMax, Math.max(defMin, settingsMin))
				: defMin;
		let clampedMax =
			settingsMax !== undefined
				? Math.max(defMin, Math.min(defMax, settingsMax))
				: defMax;
		if (clampedMin > clampedMax) {
			[clampedMin, clampedMax] = [clampedMax, clampedMin];
		}
		return {
			effectiveMin: clampedMin,
			effectiveMax: clampedMax,
		};
	}, [defMin, defMax, settingsMin, settingsMax]);

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
