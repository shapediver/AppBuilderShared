import {z} from "zod";

/** Theme `defaultProps` for `useProps("AddToCartAction", …)`. */
export const AddToCartActionThemeDefaultPropsSchema = z.strictObject({
	successMessage: z.string().optional(),
	errorMessage: z.string().optional(),
});

export type AddToCartActionThemeDefaultProps = z.infer<
	typeof AddToCartActionThemeDefaultPropsSchema
>;
