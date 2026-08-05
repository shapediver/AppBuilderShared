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
	return effect;
};
