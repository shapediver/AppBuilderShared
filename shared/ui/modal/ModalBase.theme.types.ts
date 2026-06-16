import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {
	mantineSizeTokenSchema,
	mantineSpacingSchema,
} from "@AppBuilderLib/shared/mantine-props/spacing.zod";
import {z} from "zod";

const modalBaseButtonContainerPropsSchema = mantineGroupPropsSchema.pick({
	justify: true,
	align: true,
});

/** Theme `defaultProps` for `useProps("ModalBase", …)`. */
export const ModalBaseThemeDefaultPropsSchema = z.strictObject({
	size: mantineSizeTokenSchema.optional(),
	centered: z.boolean().optional(),
	closeButtonProps: mantineButtonPropsSchema.optional(),
	stackGap: mantineSpacingSchema.optional(),
	groupGap: mantineSpacingSchema.optional(),
	buttonContainerProps: modalBaseButtonContainerPropsSchema.optional(),
	cancelButtonProps: mantineButtonPropsSchema.optional(),
	confirmButtonProps: mantineButtonPropsSchema.optional(),
});

export type ModalBaseThemeDefaultProps = z.infer<
	typeof ModalBaseThemeDefaultPropsSchema
>;
