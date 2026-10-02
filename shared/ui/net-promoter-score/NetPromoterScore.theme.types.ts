import {JsonValueSchema} from "@AppBuilderLib/features/appbuilder/config/jsonValue";
import {z} from "@AppBuilderLib/shared/lib/zod";
import {mantineButtonPropsSchema} from "@AppBuilderLib/shared/mantine-props/button.zod";
import {mantineGroupPropsSchema} from "@AppBuilderLib/shared/mantine-props/group.zod";
import {mantinePaperPropsSchema} from "@AppBuilderLib/shared/mantine-props/paper.zod";
import {mantineStackPropsSchema} from "@AppBuilderLib/shared/mantine-props/stack.zod";
import {mantineTextPropsSchema} from "@AppBuilderLib/shared/mantine-props/text.zod";

const npsOptionSchema = z.strictObject({
	title: z.string(),
	value: JsonValueSchema,
});

const npsCaptionsSchema = z.strictObject({
	start: z.string().optional(),
	end: z.string().optional(),
});

const npsScheduleSchema = z
	.strictObject({
		unit: z.enum(["minute", "hour", "day", "week", "month", "year"]),
		step: z.number().gt(0).optional(),
		day: z.number().int().min(1).max(31).optional(),
		weekday: z.number().int().min(1).max(7).optional(),
		hour: z.number().int().min(0).max(23).optional(),
		minute: z.number().int().min(0).max(59).optional(),
	})
	.superRefine((schedule, ctx) => {
		if (
			schedule.day !== undefined &&
			schedule.unit !== "month" &&
			schedule.unit !== "year"
		) {
			ctx.addIssue({
				code: "custom",
				message: "day is only allowed when unit is month or year",
				path: ["day"],
			});
		}
		if (schedule.weekday !== undefined && schedule.unit !== "week") {
			ctx.addIssue({
				code: "custom",
				message: "weekday is only allowed when unit is week",
				path: ["weekday"],
			});
		}
		const allowsClock =
			schedule.unit === "day" ||
			schedule.unit === "week" ||
			schedule.unit === "month" ||
			schedule.unit === "year";
		if (schedule.hour !== undefined && !allowsClock) {
			ctx.addIssue({
				code: "custom",
				message:
					"hour is only allowed when unit is day, week, month, or year",
				path: ["hour"],
			});
		}
		if (schedule.minute !== undefined && !allowsClock) {
			ctx.addIssue({
				code: "custom",
				message:
					"minute is only allowed when unit is day, week, month, or year",
				path: ["minute"],
			});
		}
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
	answeredSchedule: npsScheduleSchema.optional(),
	dismissedSchedule: npsScheduleSchema.optional(),
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
