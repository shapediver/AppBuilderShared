import {
	IMaterialStandardDataPropertiesDefinition,
	MATERIAL_TYPE,
	MaterialStandardData,
} from "@shapediver/viewer.session";
import {
	IPostProcessingEffectDefinition,
	IPulseEffectDefinition,
	MaterialEngine,
	POST_PROCESSING_EFFECT_TYPE,
} from "@shapediver/viewer.viewport";
import {Logger} from "./logger";

/** Invalid effects already reported, so a re-render does not repeat the warning. */
const reportedInvalidEffects = new Set<string>();

/**
 * Parse an interaction effect (selection, hover, available or dragging color).
 *
 * Accepted: a color string, a material definition, an outline post-processing
 * effect, or a pulse effect. Any other object (e.g. `{"type": null}`) is
 * dropped with a warning and `undefined` is returned, so the caller falls back
 * to its default effect. Passing it on would make the viewer treat it as an
 * outline effect it never created, which throws and unmounts the app.
 */
export const parseInteractionEffect = async (
	effect?:
		| string
		| IMaterialStandardDataPropertiesDefinition
		| IPostProcessingEffectDefinition
		| IPulseEffectDefinition
		| null,
) => {
	if (!effect) return effect;

	if (typeof effect === "string") {
		// we received a color
		return new MaterialStandardData({
			color: effect,
		});
	} else if (
		typeof effect === "object" &&
		Object.values(MATERIAL_TYPE).includes(effect.type as MATERIAL_TYPE)
	) {
		// we received a material data object
		return await MaterialEngine.instance.createMaterialDataFromDefinition(
			effect as IMaterialStandardDataPropertiesDefinition,
		);
	} else if (
		typeof effect === "object" &&
		(effect.type as POST_PROCESSING_EFFECT_TYPE) ===
			POST_PROCESSING_EFFECT_TYPE.OUTLINE
	) {
		// we received a post processing effect
		return effect as IPostProcessingEffectDefinition;
	} else if (typeof effect === "object" && effect.type === "pulse") {
		// we received a pulse effect
		return effect as IPulseEffectDefinition;
	}

	const stringified = JSON.stringify(effect);
	if (!reportedInvalidEffects.has(stringified)) {
		reportedInvalidEffects.add(stringified);
		Logger.warn(
			`Ignoring invalid interaction effect ${stringified}: "type" must be a material type, "outline" or "pulse". The default effect is used instead.`,
		);
	}
	return undefined;
};
