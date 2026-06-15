import {JsonValueSchema} from "@AppBuilderLib/shared/lib/jsonValue";
import {z} from "zod";

const containerThemeOverridesSchema = z.record(
	z.string(),
	z.record(z.string(), JsonValueSchema),
);

/** Theme `defaultProps` for `useProps("AppBuilderContainerWrapper", …)`. */
export const AppBuilderContainerWrapperThemeDefaultPropsSchema = z.strictObject({
	containerThemeOverrides: containerThemeOverridesSchema.optional(),
});

export type AppBuilderContainerWrapperThemeDefaultProps = z.infer<
	typeof AppBuilderContainerWrapperThemeDefaultPropsSchema
>;
