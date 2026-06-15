import {JsonValueSchema} from "@AppBuilderLib/shared/lib/jsonValue";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineCardPropsSchema} from "@AppBuilderLib/shared/mantine-props/card.zod";
import {mantineFlexPropsSchema} from "@AppBuilderLib/shared/mantine-props/flex.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantineImagePropsSchema} from "@AppBuilderLib/shared/mantine-props/image.zod";
import {
	mantineCssLengthSchema,
} from "@AppBuilderLib/shared/mantine-props/primitives.zod";
import {mantineSpacingSchema} from "@AppBuilderLib/shared/mantine-props/spacing.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";
import {z} from "zod";

/** Select component visualization type (matches `SelectComponentType`). */
export const selectComponentTypeSchema = z.enum([
	"buttonflex",
	"buttongroup",
	"chipgroup",
	"dropdown",
	"color",
	"imagedropdown",
	"fullwidthcards",
	"carousel",
	"grid",
	"multiselect-checkboxes",
]);

/** Serializable subset of Mantine carousel props used by select carousel widgets. */
export const selectCarouselStylePropsSchema = z.strictObject({
	controlSize: z.number().optional(),
	controlsOffset: z.union([z.string(), z.number()]).optional(),
	draggable: z.boolean().optional(),
	emblaOptions: z.record(z.string(), JsonValueSchema).optional(),
	height: mantineCssLengthSchema.optional(),
	includeGapInSize: z.boolean().optional(),
	orientation: z.enum(["horizontal", "vertical"]).optional(),
	slideGap: z
		.union([mantineSpacingSchema, z.record(z.string(), mantineSpacingSchema)])
		.optional(),
	slideSize: z
		.union([z.string(), z.record(z.string(), z.string())])
		.optional(),
	type: z.enum(["container", "media"]).optional(),
	withControls: z.boolean().optional(),
	withIndicators: z.boolean().optional(),
	withKeyboardEvents: z.boolean().optional(),
});

/** Serializable subset of Mantine `SimpleGrid` props for select grid widgets. */
export const selectSimpleGridPropsSchema = z.strictObject({
	cols: z.number().optional(),
	spacing: mantineSpacingSchema.optional(),
});

/** Theme-documented nested bags inside `SelectComponentSettings`. */
export const selectComponentSettingsSchema = z.strictObject({
	buttonProps: mantineButtonPropsSchema.optional(),
	carouselProps: selectCarouselStylePropsSchema.optional(),
	cardProps: mantineCardPropsSchema.optional(),
	flexProps: mantineFlexPropsSchema.optional(),
	groupProps: mantineGroupPropsSchema.optional(),
	gridProps: z
		.strictObject({
			cols: z.record(z.string(), z.number()).optional(),
			spacing: z.string().optional(),
		})
		.optional(),
	imageProps: mantineImagePropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
	labelProps: mantineTextPropsSchema.optional(),
	descriptionProps: mantineTextPropsSchema.optional(),
	showLabel: z.boolean().optional(),
});

/**
 * Per-parameter select overrides in theme `componentSettings`.
 * `itemData` is opaque JSON — domain item payloads are not deep-validated here.
 */
export const selectComponentOverridesSchema = z.strictObject({
	type: selectComponentTypeSchema.optional(),
	itemData: z.record(z.string(), JsonValueSchema).optional(),
	settings: selectComponentSettingsSchema.optional(),
});
