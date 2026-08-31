import {viewportScreenshotPropsSchema} from "@AppBuilderLib/entities/viewport/config/viewportScreenshotProps.zod";
import {z} from "@AppBuilderLib/shared/lib/zod";

/** Theme `defaultProps` for `useProps("AddToCartAction", …)`. */
export const AddToCartActionThemeDefaultPropsSchema = z.strictObject({
	successMessage: z.string().optional(),
	errorMessage: z.string().optional(),
	screenshotProps: viewportScreenshotPropsSchema.optional(),
});

export type AddToCartActionThemeDefaultProps = z.infer<
	typeof AddToCartActionThemeDefaultPropsSchema
>;
