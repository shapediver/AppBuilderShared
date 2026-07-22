import {JsonValueSchema} from "@AppBuilderLib/shared/lib/jsonValue";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineDividerPropsSchema} from "@AppBuilderLib/shared/mantine-props/divider.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineCssStyleRecordSchema} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import {mantineTransitionPropsSchema} from "@AppBuilderLib/shared/mantine-props/transition.zod";

/** Theme `defaultProps` for `useProps("ViewportIcons", …)`. */
export const LegacyViewportIconsThemeDefaultPropsSchema = z.strictObject({
	style: mantineCssStyleRecordSchema.optional(),
	fullscreenId: z.string().optional(),
	color: z.string().optional(),
	colorDisabled: z.string().optional(),
	variant: z.string().optional(),
	variantDisabled: z.string().optional(),
	iconStyle: JsonValueSchema.optional(),
	size: z.number().optional(),
	// Legacy visibility flags mapped to default toolbar options.
	enableHistoryButtons: z.boolean().optional(),
	enableModelStateButtons: z.boolean().optional(),
	enableImportExportButtons: z.boolean().optional(),
	enableResetButton: z.boolean().optional(),
	enableArBtn: z.boolean().optional(),
	enableCamerasBtn: z.boolean().optional(),
	enableFullscreenBtn: z.boolean().optional(),
	enableFullscreenBtn3States: z.boolean().optional(),
	enableZoomBtn: z.boolean().optional(),
	enableHistoryMenuButton: z.boolean().optional(),
	viewportOverlayProps: z.unknown().optional(),
	paperProps: mantinePaperPropsSchema.optional(),
	dividerProps: mantineDividerPropsSchema.optional(),
	transitionProps: mantineTransitionPropsSchema.optional(),
});

export type LegacyViewportIconsThemeDefaultProps = z.infer<
	typeof LegacyViewportIconsThemeDefaultPropsSchema
>;
