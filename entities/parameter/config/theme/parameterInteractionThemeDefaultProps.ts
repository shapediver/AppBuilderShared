import {z} from "zod";

/**
 * JSON-serializable values accepted in theme `defaultProps` for fields typed as
 * `InteractionEffect` in parameter interaction themes (before `parseInteractionEffect`).
 */
export const InteractionEffectThemeJsonSchema = z.union([
	z.string(),
	z.record(z.string(), z.unknown()),
	z.null(),
]);

/**
 * `ParameterDraggingComponent` — `useProps("ParameterDraggingComponent", …)`.
 */
export const ParameterDraggingComponentThemeDefaultPropsSchema = z.strictObject({
	draggingColor: InteractionEffectThemeJsonSchema.optional(),
	availableColor: InteractionEffectThemeJsonSchema.optional(),
	hoverColor: InteractionEffectThemeJsonSchema.optional(),
});

/** TypeDoc surface for `useProps("ParameterDraggingComponent", …)` theme defaults. */
export interface ParameterDraggingComponentThemeDefaultProps
	extends z.infer<typeof ParameterDraggingComponentThemeDefaultPropsSchema> {}

/**
 * `ParameterGumballComponent` — `useProps("ParameterGumballComponent", …)`.
 */
export const ParameterGumballComponentThemeDefaultPropsSchema = z.strictObject({
	selectionColor: InteractionEffectThemeJsonSchema.optional(),
	availableColor: InteractionEffectThemeJsonSchema.optional(),
	hoverColor: InteractionEffectThemeJsonSchema.optional(),
});

/** TypeDoc surface for `useProps("ParameterGumballComponent", …)` theme defaults. */
export interface ParameterGumballComponentThemeDefaultProps
	extends z.infer<typeof ParameterGumballComponentThemeDefaultPropsSchema> {}

/**
 * `ParameterSelectionComponent` — `useProps("ParameterSelectionComponent", …)`.
 */
export const ParameterSelectionComponentThemeDefaultPropsSchema = z.strictObject({
	selectionColor: InteractionEffectThemeJsonSchema.optional(),
	availableColor: InteractionEffectThemeJsonSchema.optional(),
	hoverColor: InteractionEffectThemeJsonSchema.optional(),
});

/** TypeDoc surface for `useProps("ParameterSelectionComponent", …)` theme defaults. */
export interface ParameterSelectionComponentThemeDefaultProps
	extends z.infer<typeof ParameterSelectionComponentThemeDefaultPropsSchema> {}
