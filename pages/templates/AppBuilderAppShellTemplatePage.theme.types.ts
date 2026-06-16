import {
	mantineBreakpointSchema,
	mantineResponsiveBooleanSchema,
	mantineResponsiveCssSizeSchema,
	mantineResponsiveNumberSchema,
} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import {z} from "zod";

/** Theme `defaultProps` for `useProps("AppBuilderAppShellTemplatePage", …)`. */
export const AppBuilderAppShellTemplatePageThemeDefaultPropsSchema =
	z.strictObject({
		headerHeight: mantineResponsiveCssSizeSchema.optional(),
		navbarBreakpoint: mantineBreakpointSchema.optional(),
		navbarWidth: mantineResponsiveCssSizeSchema.optional(),
		columns: mantineResponsiveNumberSchema.optional(),
		rows: mantineResponsiveNumberSchema.optional(),
		rightColumns: mantineResponsiveNumberSchema.optional(),
		bottomRows: mantineResponsiveNumberSchema.optional(),
		bottomFullWidth: mantineResponsiveBooleanSchema.optional(),
		navbarBorder: z.boolean().optional(),
		headerBorder: z.boolean().optional(),
		rightBorder: z.boolean().optional(),
		keepBottomInGrid: z.boolean().optional(),
	});

export type AppBuilderAppShellTemplatePageThemeDefaultProps = z.infer<
	typeof AppBuilderAppShellTemplatePageThemeDefaultPropsSchema
>;
