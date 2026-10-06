import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";

const npsOptionSchema = z.strictObject({
	title: z.string(),
	value: z.number(),
});

const npsCaptionsSchema = z.strictObject({
	start: z.string().optional(),
	end: z.string().optional(),
});

const npsDialogPositionSchema = z.strictObject({
	top: z.union([z.string(), z.number()]).optional(),
	left: z.union([z.string(), z.number()]).optional(),
	bottom: z.union([z.string(), z.number()]).optional(),
	right: z.union([z.string(), z.number()]).optional(),
});

const npsDialogPropsSchema = mantinePaperPropsSchema.extend({
	size: z.union([z.string(), z.number()]).optional(),
	position: npsDialogPositionSchema.optional(),
	zIndex: z.union([z.number(), z.string()]).optional(),
	withCloseButton: z.boolean().optional(),
	radius: z.union([z.string(), z.number()]).optional(),
	withinPortal: z.boolean().optional(),
	keepMounted: z.boolean().optional(),
});

/** Theme `defaultProps` for `useProps("NetPromoterScore", …)`. */
export const NetPromoterScoreThemeDefaultPropsSchema = z.strictObject({
	message: z.string().optional(),
	options: z.array(npsOptionSchema).optional(),
	captions: npsCaptionsSchema.optional(),
	openDelay: z.number().min(0).optional(),
	answeredScheduleDays: z.number().int().gt(0).optional(),
	dismissedScheduleDays: z.number().int().gt(0).optional(),
	dialogProps: npsDialogPropsSchema.optional(),
	stackProps: mantineStackPropsSchema.optional(),
	questionTextProps: mantineTextPropsSchema.optional(),
	digitsGroupProps: mantineGroupPropsSchema.optional(),
	optionButtonProps: mantineButtonPropsSchema.optional(),
	captionsGroupProps: mantineGroupPropsSchema.optional(),
	captionTextProps: mantineTextPropsSchema.optional(),
});

export type NetPromoterScoreThemeDefaultProps = z.infer<
	typeof NetPromoterScoreThemeDefaultPropsSchema
>;
