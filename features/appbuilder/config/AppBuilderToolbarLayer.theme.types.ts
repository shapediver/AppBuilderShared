import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineCssStyleRecordSchema} from "@AppBuilderLib/shared/mantine-props/primitives.zod";

/** Theme `defaultProps` for `useProps("AppBuilderToolbarLayer", …)`. */
export const AppBuilderToolbarLayerThemeDefaultPropsSchema = z.strictObject({
	style: mantineCssStyleRecordSchema.optional(),
	offset: z.string().optional(),
	offsetX: z.string().optional(),
	offsetY: z.string().optional(),
});

export type AppBuilderToolbarLayerThemeDefaultProps = z.infer<
	typeof AppBuilderToolbarLayerThemeDefaultPropsSchema
>;
